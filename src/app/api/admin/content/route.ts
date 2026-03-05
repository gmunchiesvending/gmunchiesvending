import { NextResponse } from "next/server";
import { cmsSchema } from "@/lib/schemas";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { getGithubTokenMeta, githubApiFetch } from "@/lib/github";

// ---------------- CONFIG ----------------
const OWNER = "NikoDola";
const REPO = "gmunchies";
const FILE_PATH = "src/content/data.json";
const LOCAL_ONLY = process.env.CMS_LOCAL_ONLY === "1" || process.env.LOCAL_CMS_ONLY === "1";

// ---------------- HELPERS ----------------
function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function serverError(message = "Server error") {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

function badRequest(message = "Invalid request") {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  return Boolean(session);
}

async function getErrorDetails(res: Response) {
  const status = res.status;
  const statusText = res.statusText;
  const githubRequestId = res.headers.get("x-github-request-id");
  const githubCorrelationId = res.headers.get("x-github-correlation-id");
  const wwwAuthenticate = res.headers.get("www-authenticate");
  const rateLimitRemaining = res.headers.get("x-ratelimit-remaining");
  const rateLimitLimit = res.headers.get("x-ratelimit-limit");
  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    bodyText = "";
  }
  return {
    status,
    statusText,
    githubRequestId,
    githubCorrelationId,
    wwwAuthenticate,
    rateLimitRemaining,
    rateLimitLimit,
    bodyText: bodyText.slice(0, 2000),
  };
}

async function readLocalCms() {
  const filePath = path.join(process.cwd(), "src", "content", "data.json");
  const raw = await fs.readFile(filePath, "utf8");
  const decoded = JSON.parse(raw);
  return cmsSchema.parse(decoded);
}

async function writeLocalCms(data: unknown) {
  const filePath = path.join(process.cwd(), "src", "content", "data.json");
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// ---------------- GET ----------------
export async function GET(req: Request) {
  if (!(await requireSession())) return unauthorized();

  try {
    if (LOCAL_ONLY) {
      const local = await readLocalCms();
      return NextResponse.json({
        ok: true,
        data: local,
        warning: "Local-only CMS mode enabled (CMS_LOCAL_ONLY=1). GitHub sync is disabled.",
      });
    }

    let res: Response;
    try {
      res = await githubApiFetch(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        const local = await readLocalCms();
        return NextResponse.json({
          ok: true,
          data: local,
          warning:
            "GitHub CMS fetch failed (token missing/invalid). Loaded local data.json; fix your GitHub token to enable sync.",
        });
      }
      throw e;
    }
    if (!res.ok) {
      const details = await getErrorDetails(res);
      if (details.status === 404) {
        // File doesn't exist in GitHub yet (common on preview / before first commit)
        const local = await readLocalCms();
        return NextResponse.json({
          ok: true,
          data: local,
          warning: "GitHub CMS file not found. Loaded local data.json; Save will create it in GitHub.",
        });
      }
      if ((details.status === 401 || details.status === 403) && process.env.NODE_ENV !== "production") {
        const local = await readLocalCms();
        return NextResponse.json({
          ok: true,
          data: local,
          warning:
            "GitHub token unauthorized. Loaded local data.json; update your GitHub token to enable sync.",
          details,
        });
      }
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch CMS content",
          details,
        },
        { status: 500 },
      );
    }

    const data = await res.json();
    const decoded = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    const parsed = cmsSchema.safeParse(decoded);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "CMS content failed validation", issues: parsed.error.issues },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, data: parsed.data });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Server error");
  }
}

// ---------------- BATCH COMMIT (images + content in one commit) ----------------
async function commitBatch(
  cmsData: unknown,
  images: Array<{ repoPath: string; content: string }>,
): Promise<{ sha: string; html_url?: string }> {
  const branch = process.env.GITHUB_BRANCH || "main";

  // Get latest commit SHA on branch
  const refRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/${branch}`);
  if (!refRes.ok) throw new Error(`Failed to get branch ref: ${refRes.status}`);
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha as string;

  // Get base tree SHA from that commit
  const commitRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
  if (!commitRes.ok) throw new Error(`Failed to get commit: ${commitRes.status}`);
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha as string;

  // Create blobs for each image and for data.json
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  for (const img of images) {
    const blobRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: img.content, encoding: "base64" }),
    });
    if (!blobRes.ok) throw new Error(`Failed to create blob for ${img.repoPath}: ${blobRes.status}`);
    const blobData = await blobRes.json();
    treeItems.push({ path: img.repoPath, mode: "100644", type: "blob", sha: blobData.sha });
  }

  const jsonEncoded = Buffer.from(JSON.stringify(cmsData, null, 2)).toString("base64");
  const jsonBlobRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: jsonEncoded, encoding: "base64" }),
  });
  if (!jsonBlobRes.ok) throw new Error(`Failed to create content blob: ${jsonBlobRes.status}`);
  const jsonBlobData = await jsonBlobRes.json();
  treeItems.push({ path: FILE_PATH, mode: "100644", type: "blob", sha: jsonBlobData.sha });

  // Create new tree
  const treeRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  if (!treeRes.ok) throw new Error(`Failed to create tree: ${treeRes.status}`);
  const treeData = await treeRes.json();

  // Create commit
  const newCommitRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "cms: update site content",
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error(`Failed to create commit: ${newCommitRes.status}`);
  const newCommitData = await newCommitRes.json();

  // Update branch ref
  const updateRefRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommitData.sha }),
  });
  if (!updateRefRes.ok) throw new Error(`Failed to update ref: ${updateRefRes.status}`);

  return { sha: newCommitData.sha, html_url: newCommitData.html_url };
}

// ---------------- PUT ----------------
export async function PUT(req: Request) {
  if (!(await requireSession())) return unauthorized();

  try {
    const body = await req.json();
    // Body is either plain CmsContent (legacy) or { data: CmsContent, images?: [...] }
    const isWrapped = body && typeof body === "object" && "data" in body;
    const cmsBody = isWrapped ? body.data : body;
    const pendingImages: Array<{ repoPath: string; content: string }> =
      isWrapped && Array.isArray(body.images) ? body.images : [];

    const parsed = cmsSchema.safeParse(cmsBody);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation error", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    if (LOCAL_ONLY) {
      await writeLocalCms(parsed.data);
      // In local mode, also write images to public/uploads
      for (const img of pendingImages) {
        try {
          const buf = Buffer.from(img.content, "base64");
          const dest = path.join(process.cwd(), img.repoPath);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.writeFile(dest, buf);
        } catch {
          // ignore
        }
      }
      return NextResponse.json({
        ok: true,
        committed: false,
        warning: "Local-only CMS mode enabled (CMS_LOCAL_ONLY=1). Saved locally only.",
      });
    }

    let commitSha: string | undefined;
    let commitUrl: string | undefined;

    try {
      if (pendingImages.length > 0) {
        // Batch commit: images + data.json in one shot
        const result = await commitBatch(parsed.data, pendingImages);
        commitSha = result.sha;
        commitUrl = result.html_url;
      } else {
        // Simple path: just update data.json
        let fileRes: Response;
        try {
          fileRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`);
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            try { await writeLocalCms(parsed.data); } catch { /* ignore */ }
            return NextResponse.json({
              ok: true, committed: false,
              warning: "GitHub sync failed (token missing/invalid). Saved locally only.",
            });
          }
          throw e;
        }

        let sha: string | undefined;
        if (fileRes.ok) {
          sha = (await fileRes.json()).sha;
        } else {
          const details = await getErrorDetails(fileRes);
          if (details.status !== 404) {
            if ((details.status === 401 || details.status === 403) && process.env.NODE_ENV !== "production") {
              try { await writeLocalCms(parsed.data); } catch { /* ignore */ }
              return NextResponse.json({
                ok: true, committed: false,
                warning: "GitHub token unauthorized. Saved locally only; update GitHub token to enable sync.",
                details,
              });
            }
            return NextResponse.json({ ok: false, error: "Failed to fetch CMS file", details }, { status: 500 });
          }
        }

        const encoded = Buffer.from(JSON.stringify(parsed.data, null, 2)).toString("base64");
        const updateRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
          method: "PUT",
          body: JSON.stringify({ message: "cms: update site content", content: encoded, ...(sha ? { sha } : {}) }),
        });

        if (!updateRes.ok) {
          const details = await getErrorDetails(updateRes);
          if ((details.status === 401 || details.status === 403) && process.env.NODE_ENV !== "production") {
            try { await writeLocalCms(parsed.data); } catch { /* ignore */ }
            return NextResponse.json({
              ok: true, committed: false,
              warning: "GitHub token unauthorized. Saved locally only; update GitHub token to enable sync.",
              details,
            });
          }
          return NextResponse.json({ ok: false, error: "Failed to update CMS file", details }, { status: 500 });
        }

        try {
          const updateJson = await updateRes.json();
          commitSha = updateJson?.commit?.sha;
          commitUrl = updateJson?.commit?.html_url;
        } catch { /* ignore */ }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        try { await writeLocalCms(parsed.data); } catch { /* ignore */ }
        return NextResponse.json({
          ok: true, committed: false,
          warning: `GitHub sync failed: ${e instanceof Error ? e.message : "unknown error"}. Saved locally only.`,
        });
      }
      throw e;
    }

    // Dev convenience: keep local files in sync
    if (process.env.NODE_ENV !== "production") {
      try { await writeLocalCms(parsed.data); } catch { /* ignore */ }
      for (const img of pendingImages) {
        try {
          const buf = Buffer.from(img.content, "base64");
          const dest = path.join(process.cwd(), img.repoPath);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.writeFile(dest, buf);
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({
      ok: true,
      committed: true,
      commit: { sha: commitSha, url: commitUrl },
      tokenMeta: getGithubTokenMeta(),
    });
  } catch (e) {
    if (e instanceof SyntaxError) return badRequest("Invalid JSON");
    return serverError(e instanceof Error ? e.message : "Server error");
  }
}

