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
});

async function sendViaEmailJs(
  params: {
    name: string;
    company: string;
    email: string;
    phone: string;
    service: string;
    location: string;
    description: string;
  },
  origin: string
) {
  // Accept both naming conventions (with or without NEXT_PUBLIC_ prefix)
  const serviceId = process.env.EMAILJS_SERVICE_ID ?? process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID ?? process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY ?? process.env.NEXT_PUBLIC_EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS is not configured (missing EMAILJS env vars on server)");
  }

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
    headers: {
      "Content-Type": "application/json",
      // Forward the browser's Origin so EmailJS accepts the request
      "Origin": origin,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EmailJS failed (${res.status} ${res.statusText})${body ? `: ${body}` : ""}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Validation error", issues: parsed.error.issues }, { status: 400 });
    }

    const origin =
      req.headers.get("origin") ??
      req.headers.get("referer")?.match(/^(https?:\/\/[^/]+)/)?.[1] ??
      "";

    await sendViaEmailJs(
      {
        name: parsed.data.name,
        company: parsed.data.company,
        email: parsed.data.email,
        phone: parsed.data.phone,
        service: parsed.data.service,
        location: parsed.data.location,
        description: parsed.data.description,
      },
      origin
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
