import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  company: z.string().max(200).optional().default(""),
  email: z.string().email().max(200),
  phone: z.string().max(60).optional().default(""),
  service: z.string().max(120).optional().default(""),
  location: z.string().max(120).optional().default(""),
  description: z.string().min(1).max(4000),
  recaptchaToken: z.string().min(1),
});

async function verifyRecaptcha(token: string, remoteip?: string | null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error("Missing RECAPTCHA_SECRET_KEY");

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (remoteip) params.set("remoteip", remoteip);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as null | {
    success?: boolean;
    "error-codes"?: string[];
    hostname?: string;
  };

  if (!json?.success) {
    const codes = json?.["error-codes"]?.join(", ") ?? "unknown";
    throw new Error(`reCAPTCHA failed (${codes})`);
  }
}

// Validates the form and verifies reCAPTCHA server-side.
// Email is sent client-side via EmailJS (browser-only SDK requirement).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Validation error", issues: parsed.error.issues }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await verifyRecaptcha(parsed.data.recaptchaToken, ip);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
