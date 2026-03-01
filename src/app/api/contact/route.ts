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

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function sendViaEmailJs(params: {
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  location: string;
  description: string;
}) {
  const serviceId = requireEnv("EMAILJS_SERVICE_ID");
  const templateId = requireEnv("EMAILJS_TEMPLATE_ID");
  const publicKey = requireEnv("EMAILJS_PUBLIC_KEY"); // EmailJS "Public Key" (user_id)
  const privateKey = process.env.EMAILJS_PRIVATE_KEY ?? ""; // EmailJS "Private Key" (accessToken) - recommended

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    ...(privateKey ? { accessToken: privateKey } : {}),
    template_params: {
      subject: `GMunchies: New service request from ${params.name}`,
      name: params.name,
      company: params.company || "-",
      email: params.email,
      phone: params.phone || "-",
      service: params.service || "-",
      location: params.location || "-",
      message: params.description,
      reply_to: params.email,
    },
  };

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`EmailJS failed (${res.status} ${res.statusText})${bodyText ? `: ${bodyText}` : ""}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Validation error", issues: parsed.error.issues }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await verifyRecaptcha(parsed.data.recaptchaToken, ip);

    await sendViaEmailJs({
      name: parsed.data.name,
      company: parsed.data.company,
      email: parsed.data.email,
      phone: parsed.data.phone,
      service: parsed.data.service,
      location: parsed.data.location,
      description: parsed.data.description,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

