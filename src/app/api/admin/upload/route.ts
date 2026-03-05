import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { githubApiFetch } from "@/lib/github";
import fs from "fs/promises";
import path from "path";

// ---------------- CONFIG ----------------
const OWNER = "NikoDola";
const REPO = "gmunchies";
const UPLOAD_DIR = "public/uploads";
const LOCAL_ONLY = process.env.CMS_LOCAL_ONLY === "1" || process.env.LOCAL_CMS_ONLY === "1";

// ---------------- HELPERS ----------------
function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function badRequest(message = "Invalid request") {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function serverError(message = "Server error") {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  return Boolean(session);
}

function safeFilename(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "upload";
}

function extAllowed(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return Boolean(ext && ["png", "jpg", "jpeg", "webp", "svg", "avif"].includes(ext));
}

async function writeLocalUpload(uniqueName: string, buf: Buffer) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, uniqueName), buf);
  return `/uploads/${uniqueName}`;
}

export async function POST(req: Request) {
  if (!(await requireSession())) return unauthorized();

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return badRequest("Missing file");

    if (!extAllowed(file.name)) return badRequest("Unsupported file type");

    const buf = Buffer.from(await file.arrayBuffer());
    // keep uploads reasonably sized; adjust as needed
    if (buf.length > 6 * 1024 * 1024) return badRequest("File too large (max 6MB)");

    const base = safeFilename(file.name);
    const unique = `${Date.now()}-${base}`;
    const repoPath = `${UPLOAD_DIR}/${unique}`;

    // Local-only mode (or fallback when GitHub is not configured)
    if (LOCAL_ONLY) {
      const localPath = await writeLocalUpload(unique, buf);
      return NextResponse.json({ ok: true, path: localPath, stored: "local" });
    }

    const encoded = buf.toString("base64");

    let updateRes: Response;
    try {
      updateRes = await githubApiFetch(`/repos/${OWNER}/${REPO}/contents/${repoPath}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `cms: upload ${unique}`,
          content: encoded,
        }),
      });
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        const localPath = await writeLocalUpload(unique, buf);
        return NextResponse.json({
          ok: true,
          path: localPath,
          stored: "local",
          warning: "GitHub upload failed; stored locally only (dev).",
        });
      }
      throw e;
    }

    if (!updateRes.ok) {
      const text = await updateRes.text().catch(() => "");
      if (process.env.NODE_ENV !== "production") {
        const localPath = await writeLocalUpload(unique, buf);
        return NextResponse.json({
          ok: true,
          path: localPath,
          stored: "local",
          warning: "GitHub upload unauthorized; stored locally only (dev).",
          details: { status: updateRes.status, statusText: updateRes.statusText, bodyText: text.slice(0, 2000) },
        });
      }
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to upload file to GitHub",
          details: { status: updateRes.status, statusText: updateRes.statusText, bodyText: text.slice(0, 2000) },
        },
        { status: 500 },
      );
    }

    // Dev convenience: keep local public/uploads in sync so the dev server can serve the file
    if (process.env.NODE_ENV !== "production") {
      try {
        await writeLocalUpload(unique, buf);
      } catch {
        // ignore local write errors
      }
    }

    return NextResponse.json({ ok: true, path: `/uploads/${unique}` });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Server error");
  }
}

