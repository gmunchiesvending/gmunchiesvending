"use client";

import "./Admin.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CmsContent } from "@/lib/content";
import {
  FiArrowLeft,
  FiGrid,
  FiInfo,
  FiLogOut,
  FiMapPin,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiShare2,
} from "react-icons/fi";
import { signIn, signOut, useSession } from "next-auth/react";

type EditorMode = "about" | "locations" | "services" | "testimonials" | "social";

function deepClone<T>(value: T): T {
  // structuredClone isn't available in older iOS Safari
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sc = (globalThis as any).structuredClone as undefined | ((v: unknown) => unknown);
  if (sc) return sc(value) as T;
  return JSON.parse(JSON.stringify(value)) as T;
}

function normSrc(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function Dashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [cms, setCms] = useState<CmsContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [popup, setPopup] = useState<null | { title: string; body: string; kind: "success" | "error" | "info" }>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<EditorMode>("services");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<string[]>([]);
  const [mediaTarget, setMediaTarget] = useState<
    | null
    | { type: "location" | "service"; slug: string; blockIdx?: number; field: "heroImageSrc" | "imageSrc" | "iconSrc" | "blockIconSrc" }
    | { type: "about"; field: "heroImageSrc" | "imageSrc" }
  >(null);
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());

  async function load() {
    if (loading) return;
    setLoading(true);
    setStatus("loading...");
    try {
      const res = await fetch("/api/admin/content", {
        method: "GET",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const details = json.details ? `\n${JSON.stringify(json.details, null, 2)}` : "";
        setStatus(`error: ${json.error ?? "load failed"}${details}`);
        return;
      }
      setCms(json.data as CmsContent);
      setStatus(json.warning ? `loaded (warning: ${json.warning})` : "loaded");
    } catch {
      setStatus("network error");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!cms || loading) return;
    setLoading(true);
    setStatus("saving...");
    try {
      let resolved: CmsContent = deepClone(cms);
      const pendingImages: Array<{ repoPath: string; content: string }> = [];

      if (pendingFiles.size > 0) {
        setStatus("preparing images...");

        // Collect all blob URLs referenced in cms
        const blobUrls = new Set<string>();
        function collectBlobUrls(obj: unknown) {
          if (typeof obj === "string" && obj.startsWith("blob:") && pendingFiles.has(obj)) {
            blobUrls.add(obj);
          } else if (obj && typeof obj === "object") {
            for (const v of Object.values(obj as Record<string, unknown>)) collectBlobUrls(v);
          }
        }
        collectBlobUrls(resolved);

        // Convert each file to base64 and build replacement map
        const replacements = new Map<string, string>();
        for (const blobUrl of blobUrls) {
          const file = pendingFiles.get(blobUrl)!;
          const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload";
          const unique = `${Date.now()}-${safeName}`;
          const repoPath = `public/uploads/${unique}`;
          const localPath = `/uploads/${unique}`;

          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
          }
          pendingImages.push({ repoPath, content: btoa(binary) });
          replacements.set(blobUrl, localPath);
        }

        // Replace blob URLs in cms with final /uploads/ paths
        function replaceBlobUrls(obj: unknown): unknown {
          if (typeof obj === "string") return replacements.has(obj) ? replacements.get(obj)! : obj;
          if (Array.isArray(obj)) return obj.map(replaceBlobUrls);
          if (obj && typeof obj === "object") {
            return Object.fromEntries(
              Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, replaceBlobUrls(v)]),
            );
          }
          return obj;
        }
        resolved = replaceBlobUrls(resolved) as CmsContent;

        for (const blobUrl of pendingFiles.keys()) URL.revokeObjectURL(blobUrl);
        setPendingFiles(new Map());
        setCms(resolved);
        setStatus("saving...");
      }

      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: resolved, images: pendingImages }),
      });
      const json = await res.json();
      if (!res.ok) {
        const details = json.details
          ? `\n${JSON.stringify(json.details, null, 2)}`
          : json.issues
            ? `\n${JSON.stringify(json.issues, null, 2)}`
            : "";
        const msg = `Error while saving.\n\n${json.error ?? "save failed"}${details}\n\nNeed help? Email niko: nikodola@gmail.com`;
        setStatus(`error: ${json.error ?? "save failed"}${details}`);
        setPopup({ title: "Save failed", body: msg, kind: "error" });
        return;
      }
      if (json.committed === false) {
        const msg = `Saved locally only.\n\n${json.warning ?? "GitHub sync disabled"}`;
        setStatus(`saved locally only (warning: ${json.warning ?? "GitHub sync disabled"})`);
        setPopup({ title: "Saved locally", body: msg, kind: "info" });
        return;
      }

      const sha = json.commit?.sha as string | undefined;
      const url = json.commit?.url as string | undefined;
      const msg = url
        ? `Saved to GitHub.\n\nCommit: ${sha?.slice(0, 7) ?? "unknown"}\n${url}\n\nVercel should auto-deploy shortly.`
        : "Saved to GitHub.\n\nVercel should auto-deploy shortly.";
      setStatus(url ? `saved to GitHub (${sha?.slice(0, 7) ?? "unknown"}): ${url}` : "saved to GitHub");
      setPopup({ title: "Saved", body: msg, kind: "success" });
    } catch {
      setStatus("network error");
      setPopup({
        title: "Save failed",
        body: "Network error while saving.\n\nNeed help? Email niko: nikodola@gmail.com",
        kind: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!popup) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopup(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [popup]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (cms) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  async function uploadFile(file: File): Promise<string | null> {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        const details = json.details ? `\n${JSON.stringify(json.details, null, 2)}` : "";
        setStatus(`error: ${json.error ?? "upload failed"}${details}`);
        return null;
      }
      return json.path as string;
    } catch {
      setStatus("error: upload network error");
      return null;
    }
  }

  function stageFile(file: File, onStaged: (blobUrl: string) => void) {
    const blobUrl = URL.createObjectURL(file);
    setPendingFiles((prev) => {
      const next = new Map(prev);
      next.set(blobUrl, file);
      return next;
    });
    onStaged(blobUrl);
  }

  async function openMediaPicker(target: NonNullable<typeof mediaTarget>) {
    setMediaTarget(target);
    setMediaOpen(true);
    try {
      const res = await fetch("/api/admin/media", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setStatus(`error: ${json.error ?? "failed to load media"}`);
        setMedia([]);
        return;
      }
      setMedia(json.items as string[]);
    } catch {
      setStatus("error: failed to load media");
      setMedia([]);
    }
  }

  function setImageFromPicker(path: string) {
    if (!cms || !mediaTarget) return;

    setCms((prev) => {
      if (!prev) return prev;
      const next: CmsContent = deepClone(prev);
      if (mediaTarget.type === "about") {
        next.about = { ...next.about, [mediaTarget.field]: path };
      } else if (mediaTarget.type === "location") {
        const loc = next.locations.find((l) => l.slug === mediaTarget.slug);
        if (!loc) return next;
        if (mediaTarget.field === "heroImageSrc") {
          loc.heroImageSrc = path;
        } else if (mediaTarget.field === "blockIconSrc") {
          const idx = mediaTarget.blockIdx ?? -1;
          if (idx >= 0 && loc.blocks[idx]) (loc.blocks[idx] as any).iconSrc = path;
        } else if (mediaTarget.field === "imageSrc") {
          const idx = mediaTarget.blockIdx ?? -1;
          if (idx >= 0 && loc.blocks[idx]) loc.blocks[idx].imageSrc = path;
        }
      } else if (mediaTarget.type === "service") {
        const srv = next.services.find((s) => s.slug === mediaTarget.slug);
        if (!srv) return next;
        if (mediaTarget.field === "heroImageSrc") {
          srv.heroImageSrc = path;
        } else if (mediaTarget.field === "iconSrc") {
          srv.iconSrc = path;
        } else if (mediaTarget.field === "blockIconSrc") {
          const idx = mediaTarget.blockIdx ?? -1;
          if (idx >= 0 && srv.blocks[idx]) (srv.blocks[idx] as any).iconSrc = path;
        } else {
          const idx = mediaTarget.blockIdx ?? -1;
          if (idx >= 0 && srv.blocks[idx]) srv.blocks[idx].imageSrc = path;
        }
      }
      return next;
    });
    setMediaOpen(false);
  }

  function confirmDelete(kind: "service" | "location", name: string) {
    return window.confirm(`Are you sure to remove the "${kind}" (${name})?`);
  }

  function addLocation() {
    if (!cms) return;
    const slug = `new-location-${Date.now()}`;
    setCms({
      ...cms,
      locations: [
        ...cms.locations,
        {
          slug,
          name: "New Location",
          eyebrow: "location",
          excerpt: "",
          description: "",
          iconKey: "FaMapMarkerAlt",
          heroImageSrc: "",
          blocks: [],
        },
      ],
    });
  }

  function addService() {
    if (!cms) return;
    const slug = `new-service-${Date.now()}`;
    setCms({
      ...cms,
      services: [
        ...cms.services,
        {
          slug,
          display: true,
          eyebrow: "service",
          iconSrc: "/uploads/icon-04.svg",
          title: "New Service",
          excerpt: "",
          sectionsIntro: "",
          heroImageSrc: "/uploads/hero.webp",
          blocks: [],
        },
      ],
    });
  }

  function addTestimonial() {
    if (!cms) return;
    const id = `t-${Date.now()}`;
    setCms({
      ...cms,
      testimonials: [
        ...cms.testimonials,
        {
          id,
          locationSlug: "other",
          quote: "",
          clientName: "",
          locationLabel: "",
          enabled: true,
          showOnHome: true,
          showOnTestimonialsPage: true,
        } as any,
      ],
    });
  }

  function addSocialLink() {
    if (!cms) return;
    setCms({
      ...cms,
      socialLinks: [
        ...(cms.socialLinks ?? []),
        {
          platform: "Instagram",
          url: "https://instagram.com",
          enabled: true,
        },
      ],
    });
  }

  if (!cms) {
    return (
      <main className="adminPage">
        <div className="adminTopbar">
          <h2>Admin Dashboard</h2>
          <div className="adminActions">
            {session ? (
              <button className="adminButton" onClick={() => signOut()} disabled={loading}>
                Sign out
              </button>
            ) : (
              <button className="adminButton adminButtonPrimary" onClick={() => signIn("google")} disabled={loading}>
                Sign in with Google
              </button>
            )}
            <button className="adminButton" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Reload"}
            </button>
          </div>
        </div>
        {status && <p className="adminStatus">{status}</p>}
      </main>
    );
  }

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <Link href="/" className="adminBackLink">
          <FiArrowLeft size={18} />
          <span>Back to website</span>
        </Link>

        <div className="adminSidebarNav" role="navigation" aria-label="Admin sections">
          <button
            className={`adminSidebarNavItem ${mode === "services" ? "active" : ""}`}
            onClick={() => setMode("services")}
            disabled={loading}
            type="button"
          >
            <FiGrid size={18} />
            <span>Edit services</span>
          </button>
          <button
            className={`adminSidebarNavItem ${mode === "locations" ? "active" : ""}`}
            onClick={() => setMode("locations")}
            disabled={loading}
            type="button"
          >
            <FiMapPin size={18} />
            <span>Edit locations</span>
          </button>
          <button
            className={`adminSidebarNavItem ${mode === "about" ? "active" : ""}`}
            onClick={() => setMode("about")}
            disabled={loading}
            type="button"
          >
            <FiInfo size={18} />
            <span>Edit about</span>
          </button>
          <button
            className={`adminSidebarNavItem ${mode === "testimonials" ? "active" : ""}`}
            onClick={() => setMode("testimonials")}
            disabled={loading}
            type="button"
          >
            <FiMessageSquare size={18} />
            <span>Edit testimonials</span>
          </button>
          <button
            className={`adminSidebarNavItem ${mode === "social" ? "active" : ""}`}
            onClick={() => setMode("social")}
            disabled={loading}
            type="button"
          >
            <FiShare2 size={18} />
            <span>Edit social media</span>
          </button>
        </div>

        <div className="adminSidebarActions" />

        <div className="adminSidebarFooter">
          {session ? (
            <button className="adminSidebarAction adminButton" onClick={() => signOut()} disabled={loading} type="button">
              <FiLogOut size={18} />
              <span>Sign out</span>
            </button>
          ) : null}
        </div>
      </aside>

      <div className="adminMain">
        <div className="adminMainInner">
          <div className="adminMainTopActions">
            {mode !== "about" ? (
              <button
                className="adminMainActionButton adminButton"
                onClick={
                  mode === "locations"
                    ? addLocation
                    : mode === "services"
                      ? addService
                      : mode === "testimonials"
                        ? addTestimonial
                        : addSocialLink
                }
                disabled={loading}
                type="button"
              >
                <FiPlus size={18} />
                <span>Add</span>
              </button>
            ) : null}

            <button className="adminMainActionButton adminButton" onClick={load} disabled={loading} type="button">
              <FiRefreshCw size={18} />
              <span>{loading ? "Loading..." : "Reload"}</span>
            </button>

            <button
              className="adminMainActionButton adminButton adminButtonSave"
              onClick={save}
              disabled={loading}
              type="button"
            >
              <FiSave size={18} />
              <span>{loading ? "Saving..." : "Save"}</span>
            </button>
          </div>

          {status && <p className="adminStatus">{status}</p>}
          {popup ? (
            <div
              className="adminPopupOverlay"
              role="dialog"
              aria-modal="true"
              aria-label={popup.title}
              onClick={() => setPopup(null)}
            >
              <div className="adminPopup" onClick={(e) => e.stopPropagation()}>
                <div className="adminPopupHeader">
                  <strong>{popup.title}</strong>
                  <button className="adminPopupClose" type="button" onClick={() => setPopup(null)} aria-label="Close">
                    ✕
                  </button>
                </div>
                <div className="adminPopupBody">
                  {popup.body}
                  {popup.kind === "error" ? (
                    <div style={{ marginTop: "var(--space-10)" }}>
                      <a href="mailto:nikodola@gmail.com">nikodola@gmail.com</a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

      {mode === "about" ? (
        <section className="adminSection">
          <div className="adminCard">
            <div className="adminCardBody">
              <div className="adminSubheading">About Page</div>

              <div className="adminRow">
                <div className="adminField">
                  <label>Eyebrow text</label>
                  <input
                    value={cms.about.eyebrow ?? ""}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        return { ...prev, about: { ...prev.about, eyebrow: e.target.value } };
                      })
                    }
                    disabled={loading}
                    placeholder="Who we are"
                  />
                </div>
                <div className="adminField">
                  <label>Headline</label>
                  <input
                    value={cms.about.headline ?? ""}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        return { ...prev, about: { ...prev.about, headline: e.target.value } };
                      })
                    }
                    disabled={loading}
                    placeholder="About G Munchies"
                  />
                </div>
              </div>

              <div className="adminField">
                <label>Body text</label>
                <textarea
                  value={cms.about.body ?? ""}
                  onChange={(e) =>
                    setCms((prev) => {
                      if (!prev) return prev;
                      return { ...prev, about: { ...prev.about, body: e.target.value } };
                    })
                  }
                  disabled={loading}
                  rows={8}
                />
              </div>

              <div className="adminRow">
                <div className="adminField">
                  <label>Hero image</label>
                  <div className="blockPreview">
                    {cms.about.heroImageSrc ? <img src={cms.about.heroImageSrc} alt="" /> : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        stageFile(file, (blobUrl) =>
                          setCms((prev) => {
                            if (!prev) return prev;
                            return { ...prev, about: { ...prev.about, heroImageSrc: blobUrl } };
                          }),
                        );
                      }}
                      disabled={loading}
                    />
                    <button
                      className="adminButton"
                      type="button"
                      onClick={() => openMediaPicker({ type: "about", field: "heroImageSrc" })}
                      disabled={loading}
                    >
                      Add image from media
                    </button>
                  </div>
                </div>

                <div className="adminField">
                  <label>Content image</label>
                  <div className="blockPreview">
                    {cms.about.imageSrc ? <img src={cms.about.imageSrc} alt="" /> : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        stageFile(file, (blobUrl) =>
                          setCms((prev) => {
                            if (!prev) return prev;
                            return { ...prev, about: { ...prev.about, imageSrc: blobUrl } };
                          }),
                        );
                      }}
                      disabled={loading}
                    />
                    <button
                      className="adminButton"
                      type="button"
                      onClick={() => openMediaPicker({ type: "about", field: "imageSrc" })}
                      disabled={loading}
                    >
                      Add image from media
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : mode === "locations" ? (
        <section className="adminSection">
          <div className="adminSettingsCard">
            <div style={{ fontWeight: 800 }}>Locations listing text</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              This appears under the location cards (Home + /locations). Leave blank for now if you don’t want it.
            </div>
            <div className="adminField" style={{ marginTop: "var(--space-8)" }}>
              <textarea
                value={cms.locationsListingText ?? ""}
                onChange={(e) => setCms((prev) => (prev ? { ...prev, locationsListingText: e.target.value } : prev))}
                disabled={loading}
                placeholder="Supports blank lines for paragraph breaks."
              />
            </div>
          </div>

          {cms.locations.map((loc, locIdx) => (
            <details key={`loc-${locIdx}`} className="adminCard">
              <summary className="adminCardHeader">
                <div>
                  <h3>{loc.name}</h3>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>/location/{loc.slug}</div>
                </div>
                <div
                  className="adminCardHeaderActions"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    className="adminButton adminButtonDeleteEntity adminCardHeaderDelete"
                    type="button"
                    onClick={() => {
                      if (!confirmDelete("location", loc.name)) return;
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        next.locations = next.locations.filter((l) => l.slug !== loc.slug);
                        return next;
                      });
                    }}
                    disabled={loading}
                    aria-label={`Delete location ${loc.name}`}
                  >
                    Delete
                  </button>
                </div>
              </summary>

              <div className="adminCardBody">
                <div className="adminSubheading">Hero section</div>
                <div className="adminRow">
                  <div className="adminField">
                    <label>Slug</label>
                    <input
                      value={loc.slug}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.locations.find((l) => l.slug === loc.slug);
                          if (target) target.slug = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="adminField">
                    <label>Hero eyebrow</label>
                    <input
                      value={(loc as any).eyebrow ?? ""}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.locations.find((l) => l.slug === loc.slug);
                          if (target) (target as any).eyebrow = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                      placeholder="location"
                    />
                  </div>
                  <div className="adminField">
                    <label>Name</label>
                    <input
                      value={loc.name}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.locations.find((l) => l.slug === loc.slug);
                          if (target) target.name = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="adminField">
                  <label>Excerpt</label>
                  <textarea
                    value={(loc as any).excerpt ?? ""}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        const target = next.locations.find((l) => l.slug === loc.slug);
                        if (target) (target as any).excerpt = e.target.value;
                        return next;
                      })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="adminField">
                  <label>Description</label>
                  <textarea
                    value={loc.description ?? ""}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        const target = next.locations.find((l) => l.slug === loc.slug);
                        if (target) target.description = e.target.value;
                        return next;
                      })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="adminRow">
                  <div className="adminField">
                    <label>Hero image</label>
                    <div className="blockPreview">
                      {loc.heroImageSrc ? <img src={loc.heroImageSrc} alt="" /> : null}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          stageFile(file, (blobUrl) =>
                            setCms((prev) => {
                              if (!prev) return prev;
                              const next = deepClone(prev);
                              const target = next.locations.find((l) => l.slug === loc.slug);
                              if (target) target.heroImageSrc = blobUrl;
                              return next;
                            }),
                          );
                        }}
                        disabled={loading}
                      />
                      <button
                        className="adminButton"
                        type="button"
                        onClick={() => openMediaPicker({ type: "location", slug: loc.slug, field: "heroImageSrc" })}
                        disabled={loading}
                      >
                        Add image from media
                      </button>
                    </div>
                  </div>

                  <div className="adminField">
                    <label>Icon key</label>
                    <select
                      value={loc.iconKey ?? "FaMapMarkerAlt"}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.locations.find((l) => l.slug === loc.slug);
                          if (target) target.iconKey = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    >
                      <option value="FaBuilding">FaBuilding</option>
                      <option value="FaHome">FaHome</option>
                      <option value="FaWarehouse">FaWarehouse</option>
                      <option value="FaDumbbell">FaDumbbell</option>
                      <option value="FaHospital">FaHospital</option>
                      <option value="FaGraduationCap">FaGraduationCap</option>
                      <option value="FaMapMarkerAlt">FaMapMarkerAlt</option>
                    </select>
                  </div>
                </div>

                <div className="adminField">
                  <label>Blocks</label>
                  <div className="adminActions">
                    <button
                      className="adminButton"
                      onClick={() =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.locations.find((l) => l.slug === loc.slug);
                          if (!target) return next;
                          target.blocks.push({ layout: "left", eyebrow: "", heading: "New block", body: "", iconSrc: "", imageSrc: "" });
                          return next;
                        })
                      }
                      disabled={loading}
                    >
                      Add block
                    </button>
                  </div>

                  <div className="blocksList">
                    {loc.blocks.map((b, idx) => (
                      <div key={idx} className="blockItem">
                        <div className="adminBlockHeader">
                          <div className="adminBlockKicker">Section {idx + 1}</div>
                          <div className="adminBlockTitle">{b.heading || "Untitled section"}</div>
                        </div>
                        <div className="adminRow">
                          <div className="adminField">
                            <label>Layout</label>
                            <select
                              value={b.layout}
                              onChange={(e) =>
                                setCms((prev) => {
                                  if (!prev) return prev;
                                  const next = deepClone(prev);
                                  const target = next.locations.find((l) => l.slug === loc.slug);
                                  if (target) target.blocks[idx].layout = e.target.value as any;
                                  return next;
                                })
                              }
                              disabled={loading}
                            >
                              <option value="left">left</option>
                              <option value="right">right</option>
                              <option value="center">center</option>
                            </select>
                          </div>
                          <div className="adminField">
                            <label>Before headline</label>
                            <input
                              value={b.eyebrow ?? ""}
                              onChange={(e) =>
                                setCms((prev) => {
                                  if (!prev) return prev;
                                  const next = deepClone(prev);
                                  const target = next.locations.find((l) => l.slug === loc.slug);
                                  if (target) target.blocks[idx].eyebrow = e.target.value;
                                  return next;
                                })
                              }
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="adminField">
                          <label>Headline</label>
                          <input
                            value={b.heading}
                            onChange={(e) =>
                              setCms((prev) => {
                                if (!prev) return prev;
                                const next = deepClone(prev);
                                const target = next.locations.find((l) => l.slug === loc.slug);
                                if (target) target.blocks[idx].heading = e.target.value;
                                return next;
                              })
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="adminField">
                          <label>After headline</label>
                          <textarea
                            value={b.body ?? ""}
                            onChange={(e) =>
                              setCms((prev) => {
                                if (!prev) return prev;
                                const next = deepClone(prev);
                                const target = next.locations.find((l) => l.slug === loc.slug);
                                if (target) target.blocks[idx].body = e.target.value;
                                return next;
                              })
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="adminMediaRow adminFieldSectionIcon">
                          <div className="adminMediaCol">
                            <label>Section icon (optional)</label>
                            <div className="adminMediaPreview adminMediaPreviewIcon">
                              {normSrc((b as any).iconSrc) ? (
                                <img src={normSrc((b as any).iconSrc)} alt="Icon preview" />
                              ) : (
                                <div className="adminMediaEmpty">No section icon</div>
                              )}
                            </div>
                            <div className="adminMediaControls">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  stageFile(file, (blobUrl) =>
                                    setCms((prev) => {
                                      if (!prev) return prev;
                                      const next = deepClone(prev);
                                      const target = next.locations.find((l) => l.slug === loc.slug);
                                      if (target) (target.blocks[idx] as any).iconSrc = blobUrl;
                                      return next;
                                    }),
                                  );
                                }}
                                disabled={loading}
                              />
                              <button
                                className="adminButton"
                                type="button"
                                onClick={() =>
                                  openMediaPicker({ type: "location", slug: loc.slug, field: "blockIconSrc", blockIdx: idx })
                                }
                                disabled={loading}
                              >
                                Add icon from media
                              </button>
                              <div className="adminMediaPath">{normSrc((b as any).iconSrc)}</div>
                            </div>
                          </div>

                          <div className="adminMediaCol adminMediaColWide">
                            <label>Image</label>
                            <div className="adminMediaPreview adminMediaPreviewLarge">
                              {normSrc(b.imageSrc) ? (
                                <img src={normSrc(b.imageSrc)} alt="Section image preview" />
                              ) : (
                                <div className="adminMediaEmpty">No image</div>
                              )}
                            </div>
                            <div className="adminMediaControls">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  stageFile(file, (blobUrl) =>
                                    setCms((prev) => {
                                      if (!prev) return prev;
                                      const next = deepClone(prev);
                                      const target = next.locations.find((l) => l.slug === loc.slug);
                                      if (target) target.blocks[idx].imageSrc = blobUrl;
                                      return next;
                                    }),
                                  );
                                }}
                                disabled={loading}
                              />
                              <button
                                className="adminButton"
                                type="button"
                                onClick={() =>
                                  openMediaPicker({ type: "location", slug: loc.slug, field: "imageSrc", blockIdx: idx })
                                }
                                disabled={loading}
                              >
                                Add image from media
                              </button>
                              <button
                                className="adminButton adminButtonDanger"
                                type="button"
                                onClick={() =>
                                  setCms((prev) => {
                                    if (!prev) return prev;
                                    const next = deepClone(prev);
                                    const target = next.locations.find((l) => l.slug === loc.slug);
                                    if (target) target.blocks[idx].imageSrc = "";
                                    return next;
                                  })
                                }
                                disabled={loading}
                              >
                                Remove image
                              </button>
                              <div className="adminMediaPath">{normSrc(b.imageSrc)}</div>
                            </div>
                          </div>
                        </div>

                        <button
                          className="adminButton adminButtonDanger"
                          onClick={() =>
                            setCms((prev) => {
                              if (!prev) return prev;
                              const next = deepClone(prev);
                              const target = next.locations.find((l) => l.slug === loc.slug);
                              if (target) target.blocks.splice(idx, 1);
                              return next;
                            })
                          }
                          disabled={loading}
                        >
                          Delete block
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </details>
          ))}

          <div className="adminSettingsCard">
            <div style={{ fontWeight: 800 }}>Dynamic pages</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              If disabled, Locations will not appear in the navbar and cards won’t link to /location/[slug].
            </div>
            <div className="adminRadioRow">
              <label className="adminRadio">
                <input
                  type="radio"
                  name="locations-dynamic"
                  checked={cms.dynamicPages.locations === true}
                  onChange={() => setCms((prev) => (prev ? { ...prev, dynamicPages: { ...prev.dynamicPages, locations: true } } : prev))}
                  disabled={loading}
                />
                On
              </label>
              <label className="adminRadio">
                <input
                  type="radio"
                  name="locations-dynamic"
                  checked={cms.dynamicPages.locations === false}
                  onChange={() => setCms((prev) => (prev ? { ...prev, dynamicPages: { ...prev.dynamicPages, locations: false } } : prev))}
                  disabled={loading}
                />
                Off
              </label>
            </div>
          </div>
        </section>
      ) : mode === "services" ? (
        <section className="adminSection">
          <div className="adminSettingsCard">
            <div style={{ fontWeight: 800 }}>Services listing text</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              This appears under the services cards (Home + /services). Use a blank line to create a new paragraph.
            </div>
            <div className="adminField" style={{ marginTop: "var(--space-8)" }}>
              <textarea
                value={cms.servicesListingText ?? ""}
                onChange={(e) => setCms((prev) => (prev ? { ...prev, servicesListingText: e.target.value } : prev))}
                disabled={loading}
                placeholder="Supports blank lines for paragraph breaks."
              />
            </div>
          </div>

          {cms.services.map((srv, srvIdx) => (
            <details key={`srv-${srvIdx}`} className="adminCard">
              <summary className="adminCardHeader">
                <div>
                  <h3>{srv.title}</h3>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>/service/{srv.slug}</div>
                </div>
                <div
                  className="adminCardHeaderActions"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="adminRadioPill adminRadioPillHeader" aria-label="Show on homepage">
                    <label className="adminRadioPillOption">
                      <input
                        type="radio"
                        name={`srv-display-header-${srvIdx}`}
                        checked={srv.display === true}
                        onChange={() =>
                          setCms((prev) => {
                            if (!prev) return prev;
                            const next = deepClone(prev);
                            const target = next.services.find((s) => s.slug === srv.slug);
                            if (target) target.display = true;
                            return next;
                          })
                        }
                        disabled={loading}
                      />
                      <span>Show</span>
                    </label>
                    <label className="adminRadioPillOption">
                      <input
                        type="radio"
                        name={`srv-display-header-${srvIdx}`}
                        checked={srv.display === false}
                        onChange={() =>
                          setCms((prev) => {
                            if (!prev) return prev;
                            const next = deepClone(prev);
                            const target = next.services.find((s) => s.slug === srv.slug);
                            if (target) target.display = false;
                            return next;
                          })
                        }
                        disabled={loading}
                      />
                      <span>Hide</span>
                    </label>
                  </div>

                  <button
                    className="adminButton adminButtonDeleteEntity adminCardHeaderDelete"
                    type="button"
                    onClick={() => {
                      if (!confirmDelete("service", srv.title)) return;
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        next.services = next.services.filter((s) => s.slug !== srv.slug);
                        return next;
                      });
                    }}
                    disabled={loading}
                    aria-label={`Delete service ${srv.title}`}
                  >
                    Delete
                  </button>
                </div>
              </summary>
              <div className="adminCardBody">
                <div className="adminSubheading">Hero section</div>
                <div className="adminRow">
                  <div className="adminField">
                    <label>Slug</label>
                    <input
                      value={srv.slug}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.services.find((s) => s.slug === srv.slug);
                          if (target) target.slug = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="adminField">
                    <label>Hero eyebrow</label>
                    <input
                      value={(srv as any).eyebrow ?? ""}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.services.find((s) => s.slug === srv.slug);
                          if (target) (target as any).eyebrow = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                      placeholder="service"
                    />
                  </div>
                  <div className="adminField">
                    <label>Title</label>
                    <input
                      value={srv.title}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.services.find((s) => s.slug === srv.slug);
                          if (target) target.title = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="adminField">
                  <label>Icon image</label>
                  <div className="blockPreview">
                    {srv.iconSrc ? <img src={srv.iconSrc} alt="" /> : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        stageFile(file, (blobUrl) =>
                          setCms((prev) => {
                            if (!prev) return prev;
                            const next = deepClone(prev);
                            const target = next.services.find((s) => s.slug === srv.slug);
                            if (target) target.iconSrc = blobUrl;
                            return next;
                          }),
                        );
                      }}
                      disabled={loading}
                    />
                    <button
                      className="adminButton"
                      type="button"
                      onClick={() => openMediaPicker({ type: "service", slug: srv.slug, field: "iconSrc" })}
                      disabled={loading}
                    >
                      Add icon from media
                    </button>
                    <input
                      value={srv.iconSrc}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.services.find((s) => s.slug === srv.slug);
                          if (target) target.iconSrc = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="adminField">
                  <label>Excerpt</label>
                  <textarea
                    value={srv.excerpt}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        const target = next.services.find((s) => s.slug === srv.slug);
                        if (target) target.excerpt = e.target.value;
                        return next;
                      })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="adminField">
                  <label>Hero image</label>
                  <div className="blockPreview">
                    {srv.heroImageSrc ? <img src={srv.heroImageSrc} alt="" /> : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        stageFile(file, (blobUrl) =>
                          setCms((prev) => {
                            if (!prev) return prev;
                            const next = deepClone(prev);
                            const target = next.services.find((s) => s.slug === srv.slug);
                            if (target) target.heroImageSrc = blobUrl;
                            return next;
                          }),
                        );
                      }}
                      disabled={loading}
                    />
                    <button
                      className="adminButton"
                      type="button"
                      onClick={() => openMediaPicker({ type: "service", slug: srv.slug, field: "heroImageSrc" })}
                      disabled={loading}
                    >
                      Add image from media
                    </button>
                  </div>
                </div>

                <div className="adminField">
                  <label>Blocks</label>
                  <div className="adminActions">
                    <button
                      className="adminButton"
                      onClick={() =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const target = next.services.find((s) => s.slug === srv.slug);
                          if (!target) return next;
                          target.blocks.push({ layout: "left", eyebrow: "", heading: "New block", body: "", iconSrc: "", imageSrc: "" });
                          return next;
                        })
                      }
                      disabled={loading}
                    >
                      Add block
                    </button>
                  </div>

                  <div className="blocksList">
                    {srv.blocks.map((b, idx) => (
                      <div key={idx} className="blockItem">
                        <div className="adminBlockHeader">
                          <div className="adminBlockKicker">Section {idx + 1}</div>
                          <div className="adminBlockTitle">{b.heading || "Untitled section"}</div>
                        </div>
                        <div className="adminRow">
                          <div className="adminField">
                            <label>Layout</label>
                            <select
                              value={b.layout}
                              onChange={(e) =>
                                setCms((prev) => {
                                  if (!prev) return prev;
                                  const next = deepClone(prev);
                                  const target = next.services.find((s) => s.slug === srv.slug);
                                  if (target) target.blocks[idx].layout = e.target.value as any;
                                  return next;
                                })
                              }
                              disabled={loading}
                            >
                              <option value="left">left</option>
                              <option value="right">right</option>
                              <option value="center">center</option>
                            </select>
                          </div>
                          <div className="adminField">
                            <label>Before headline</label>
                            <input
                              value={b.eyebrow ?? ""}
                              onChange={(e) =>
                                setCms((prev) => {
                                  if (!prev) return prev;
                                  const next = deepClone(prev);
                                  const target = next.services.find((s) => s.slug === srv.slug);
                                  if (target) target.blocks[idx].eyebrow = e.target.value;
                                  return next;
                                })
                              }
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="adminField">
                          <label>Headline</label>
                          <input
                            value={b.heading}
                            onChange={(e) =>
                              setCms((prev) => {
                                if (!prev) return prev;
                                const next = deepClone(prev);
                                const target = next.services.find((s) => s.slug === srv.slug);
                                if (target) target.blocks[idx].heading = e.target.value;
                                return next;
                              })
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="adminField">
                          <label>After headline</label>
                          <textarea
                            value={b.body ?? ""}
                            onChange={(e) =>
                              setCms((prev) => {
                                if (!prev) return prev;
                                const next = deepClone(prev);
                                const target = next.services.find((s) => s.slug === srv.slug);
                                if (target) target.blocks[idx].body = e.target.value;
                                return next;
                              })
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="adminMediaRow adminFieldSectionIcon">
                          <div className="adminMediaCol">
                            <label>Section icon (optional)</label>
                            <div className="adminMediaPreview adminMediaPreviewIcon">
                              {normSrc((b as any).iconSrc) ? (
                                <img src={normSrc((b as any).iconSrc)} alt="Icon preview" />
                              ) : (
                                <div className="adminMediaEmpty">No icon</div>
                              )}
                            </div>
                            <div className="adminMediaControls">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  stageFile(file, (blobUrl) =>
                                    setCms((prev) => {
                                      if (!prev) return prev;
                                      const next = deepClone(prev);
                                      const target = next.services.find((s) => s.slug === srv.slug);
                                      if (target) (target.blocks[idx] as any).iconSrc = blobUrl;
                                      return next;
                                    }),
                                  );
                                }}
                                disabled={loading}
                              />
                              <button
                                className="adminButton"
                                type="button"
                                onClick={() =>
                                  openMediaPicker({ type: "service", slug: srv.slug, field: "blockIconSrc", blockIdx: idx })
                                }
                                disabled={loading}
                              >
                                Add icon from media
                              </button>
                              <div className="adminMediaPath">{normSrc((b as any).iconSrc)}</div>
                            </div>
                          </div>

                          <div className="adminMediaCol adminMediaColWide">
                            <label>Image</label>
                            <div className="adminMediaPreview adminMediaPreviewLarge">
                              {normSrc(b.imageSrc) ? (
                                <img src={normSrc(b.imageSrc)} alt="Section image preview" />
                              ) : (
                                <div className="adminMediaEmpty">No image</div>
                              )}
                            </div>
                            <div className="adminMediaControls">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  stageFile(file, (blobUrl) =>
                                    setCms((prev) => {
                                      if (!prev) return prev;
                                      const next = deepClone(prev);
                                      const target = next.services.find((s) => s.slug === srv.slug);
                                      if (target) target.blocks[idx].imageSrc = blobUrl;
                                      return next;
                                    }),
                                  );
                                }}
                                disabled={loading}
                              />
                              <button
                                className="adminButton"
                                type="button"
                                onClick={() => openMediaPicker({ type: "service", slug: srv.slug, field: "imageSrc", blockIdx: idx })}
                                disabled={loading}
                              >
                                Add image from media
                              </button>
                              <button
                                className="adminButton adminButtonDanger"
                                type="button"
                                onClick={() =>
                                  setCms((prev) => {
                                    if (!prev) return prev;
                                    const next = deepClone(prev);
                                    const target = next.services.find((s) => s.slug === srv.slug);
                                    if (target) target.blocks[idx].imageSrc = "";
                                    return next;
                                  })
                                }
                                disabled={loading}
                              >
                                Remove image
                              </button>
                              <div className="adminMediaPath">{normSrc(b.imageSrc)}</div>
                            </div>
                          </div>
                        </div>

                        <button
                          className="adminButton adminButtonDanger"
                          onClick={() =>
                            setCms((prev) => {
                              if (!prev) return prev;
                              const next = deepClone(prev);
                              const target = next.services.find((s) => s.slug === srv.slug);
                              if (target) target.blocks.splice(idx, 1);
                              return next;
                            })
                          }
                          disabled={loading}
                        >
                          Delete block
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </details>
          ))}

          <div className="adminSettingsCard">
            <div style={{ fontWeight: 800 }}>Dynamic pages</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              If disabled, Services will not appear in the navbar and cards won’t link to /service/[slug].
            </div>
            <div className="adminRadioRow">
              <label className="adminRadio">
                <input
                  type="radio"
                  name="services-dynamic"
                  checked={cms.dynamicPages.services === true}
                  onChange={() => setCms((prev) => (prev ? { ...prev, dynamicPages: { ...prev.dynamicPages, services: true } } : prev))}
                  disabled={loading}
                />
                On
              </label>
              <label className="adminRadio">
                <input
                  type="radio"
                  name="services-dynamic"
                  checked={cms.dynamicPages.services === false}
                  onChange={() => setCms((prev) => (prev ? { ...prev, dynamicPages: { ...prev.dynamicPages, services: false } } : prev))}
                  disabled={loading}
                />
                Off
              </label>
            </div>
          </div>
        </section>
      ) : mode === "testimonials" ? (
        <section className="adminSection">
          {cms.testimonials.map((t, idx) => (
            <details key={`t-${idx}`} className="adminCard">
              <summary className="adminCardHeader">
                <div>
                  <h3>{t.clientName || "New testimonial"}</h3>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>{t.id}</div>
                </div>
              </summary>

              <div className="adminCardBody">
                <div className="adminSubheading">Hero section</div>

                <div className="adminRow">
                  <div className="adminField">
                    <label>ID</label>
                    <input
                      value={t.id}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].id = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="adminField">
                    <label>Location slug (for location pages)</label>
                    <input
                      value={t.locationSlug}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].locationSlug = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                      placeholder="office-building"
                    />
                  </div>
                </div>

                <div className="adminRow">
                  <div className="adminField">
                    <label>Client name</label>
                    <input
                      value={t.clientName}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].clientName = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="adminField">
                    <label>Location label</label>
                    <input
                      value={t.locationLabel ?? ""}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].locationLabel = e.target.value;
                          return next;
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="adminField">
                  <label>Quote</label>
                  <textarea
                    value={t.quote}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        if (next.testimonials[idx]) next.testimonials[idx].quote = e.target.value;
                        return next;
                      })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="adminRow">
                  <div className="adminField">
                    <label>Enabled</label>
                    <select
                      value={t.enabled ? "yes" : "no"}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].enabled = e.target.value === "yes";
                          return next;
                        })
                      }
                      disabled={loading}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="adminField">
                    <label>Show on home</label>
                    <select
                      value={t.showOnHome ? "yes" : "no"}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].showOnHome = e.target.value === "yes";
                          return next;
                        })
                      }
                      disabled={loading}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="adminRow">
                  <div className="adminField">
                    <label>Show on /testimonials</label>
                    <select
                      value={t.showOnTestimonialsPage ? "yes" : "no"}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          if (next.testimonials[idx]) next.testimonials[idx].showOnTestimonialsPage = e.target.value === "yes";
                          return next;
                        })
                      }
                      disabled={loading}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="adminField">
                    <label>Rating (optional)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={(t as any).rating ?? ""}
                      onChange={(e) =>
                        setCms((prev) => {
                          if (!prev) return prev;
                          const next = deepClone(prev);
                          const v = e.target.value ? Number(e.target.value) : undefined;
                          if (next.testimonials[idx]) (next.testimonials[idx] as any).rating = v;
                          return next;
                        })
                      }
                      disabled={loading}
                      placeholder="5"
                    />
                  </div>
                </div>

                <button
                  className="adminButton adminButtonDeleteEntity"
                  onClick={() => {
                    if (!window.confirm(`Delete testimonial "${t.clientName || t.id}"?`)) return;
                    setCms((prev) => {
                      if (!prev) return prev;
                      const next = deepClone(prev);
                      next.testimonials.splice(idx, 1);
                      return next;
                    });
                  }}
                  disabled={loading}
                >
                  Delete testimonial
                </button>
              </div>
            </details>
          ))}
        </section>
      ) : (
        <section className="adminSection">
          <div className="adminSettingsCard">
            <div style={{ fontWeight: 800 }}>Social media</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              These links are used in the footer. Add only the platforms you want visible.
            </div>
          </div>

          {(cms.socialLinks ?? []).map((s, idx) => (
            <div key={`${s.platform}-${idx}`} className="adminSettingsCard">
              <div className="adminRow">
                <div className="adminField">
                  <label>Platform</label>
                  <select
                    value={s.platform}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        if (!next.socialLinks) next.socialLinks = [];
                        if (next.socialLinks[idx]) next.socialLinks[idx].platform = e.target.value;
                        return next;
                      })
                    }
                    disabled={loading}
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Yelp">Yelp</option>
                    <option value="Google">Google</option>
                    <option value="X">X</option>
                  </select>
                </div>

                <div className="adminField">
                  <label>Enabled</label>
                  <select
                    value={s.enabled === false ? "no" : "yes"}
                    onChange={(e) =>
                      setCms((prev) => {
                        if (!prev) return prev;
                        const next = deepClone(prev);
                        if (!next.socialLinks) next.socialLinks = [];
                        if (next.socialLinks[idx]) next.socialLinks[idx].enabled = e.target.value === "yes";
                        return next;
                      })
                    }
                    disabled={loading}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="adminField">
                <label>URL</label>
                <input
                  value={s.url}
                  onChange={(e) =>
                    setCms((prev) => {
                      if (!prev) return prev;
                      const next = deepClone(prev);
                      if (!next.socialLinks) next.socialLinks = [];
                      if (next.socialLinks[idx]) next.socialLinks[idx].url = e.target.value;
                      return next;
                    })
                  }
                  disabled={loading}
                  placeholder="https://..."
                />
              </div>

              <div className="adminActions">
                <button
                  className="adminButton"
                  type="button"
                  onClick={() =>
                    setCms((prev) => {
                      if (!prev) return prev;
                      const next = deepClone(prev);
                      if (!next.socialLinks) next.socialLinks = [];
                      if (idx <= 0) return next;
                      const tmp = next.socialLinks[idx - 1];
                      next.socialLinks[idx - 1] = next.socialLinks[idx];
                      next.socialLinks[idx] = tmp;
                      return next;
                    })
                  }
                  disabled={loading || idx === 0}
                >
                  Move up
                </button>
                <button
                  className="adminButton"
                  type="button"
                  onClick={() =>
                    setCms((prev) => {
                      if (!prev) return prev;
                      const next = deepClone(prev);
                      if (!next.socialLinks) next.socialLinks = [];
                      if (idx >= next.socialLinks.length - 1) return next;
                      const tmp = next.socialLinks[idx + 1];
                      next.socialLinks[idx + 1] = next.socialLinks[idx];
                      next.socialLinks[idx] = tmp;
                      return next;
                    })
                  }
                  disabled={loading || idx === (cms.socialLinks?.length ?? 0) - 1}
                >
                  Move down
                </button>
                <button
                  className="adminButton adminButtonDeleteEntity"
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Delete social link "${s.platform}"?`)) return;
                    setCms((prev) => {
                      if (!prev) return prev;
                      const next = deepClone(prev);
                      next.socialLinks = (next.socialLinks ?? []).filter((_, i) => i !== idx);
                      return next;
                    });
                  }}
                  disabled={loading}
                >
                  Delete link
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

          {mediaOpen ? (
            <div className="adminModalOverlay" role="dialog" aria-modal="true">
              <div className="adminModal">
                <div className="adminModalHeader">
                  <h3>Media</h3>
                  <button className="adminButton" onClick={() => setMediaOpen(false)} disabled={loading}>
                    Close
                  </button>
                </div>
                <div className="adminMediaGrid">
                  {media.map((p) => (
                    <button key={p} className="adminMediaItem" onClick={() => setImageFromPicker(p)}>
                      <img src={p} alt={p} />
                      <div className="adminMediaLabel">{p}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

