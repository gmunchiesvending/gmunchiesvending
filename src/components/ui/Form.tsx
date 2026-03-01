"use client";

import "./Form.css";
import { useMemo, useRef, useState } from "react";

type FormProps = {
  services: { slug: string; title: string; display: boolean }[];
  locations: { slug: string; name: string }[];
};

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: any) => number;
      execute: (widgetId?: number) => void;
      reset: (widgetId?: number) => void;
    };
  }
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
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS is not configured. Missing NEXT_PUBLIC_EMAILJS_* environment variables.");
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
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
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`EmailJS failed (${res.status} ${res.statusText})${bodyText ? `: ${bodyText}` : ""}`);
  }
}

export default function Form({ services, locations }: FormProps) {
  const visibleServices = services.filter((s) => s.display);
  const formRef = useRef<HTMLFormElement | null>(null);
  const captchaHostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const tokenResolverRef = useRef<null | ((t: string) => void)>(null);

  const siteKey = useMemo(() => {
    return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY ?? "";
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRecaptcha = async () => {
    if (typeof window === "undefined") return;
    // Poll for grecaptcha.render specifically — grecaptcha object may exist as a stub before render is ready
    if (window.grecaptcha?.render) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]');
      const poll = () => (window.grecaptcha?.render ? resolve() : setTimeout(poll, 50));
      if (existing) {
        poll();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = poll;
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
      document.head.appendChild(s);
    });
  };

  const ensureWidget = async () => {
    if (!siteKey) throw new Error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
    await loadRecaptcha();
    if (!captchaHostRef.current) throw new Error("Missing captcha host");
    if (!window.grecaptcha?.render) throw new Error("reCAPTCHA not available");
    if (widgetIdRef.current !== null) return widgetIdRef.current;
    const id = window.grecaptcha.render(captchaHostRef.current, {
      sitekey: siteKey,
      size: "invisible",
      callback: (token: string) => {
        tokenResolverRef.current?.(token);
        tokenResolverRef.current = null;
      },
      "error-callback": () => {
        tokenResolverRef.current?.("");
        tokenResolverRef.current = null;
      },
      "expired-callback": () => {
        tokenResolverRef.current?.("");
        tokenResolverRef.current = null;
      },
    });
    widgetIdRef.current = id;
    return id;
  };

  const executeCaptcha = async () => {
    const widgetId = await ensureWidget();
    if (!window.grecaptcha) throw new Error("reCAPTCHA not available");
    const token = await new Promise<string>((resolve) => {
      tokenResolverRef.current = resolve;
      window.grecaptcha!.execute(widgetId);
    });
    if (!token) throw new Error("reCAPTCHA failed");
    return token;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const fd = new FormData(formRef.current);
      const token = await executeCaptcha();

      const formData = {
        name: String(fd.get("name") ?? ""),
        company: String(fd.get("company") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        service: String(fd.get("service") ?? ""),
        location: String(fd.get("location") ?? ""),
        description: String(fd.get("description") ?? ""),
      };

      // Step 1: Verify reCAPTCHA and validate form server-side
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, recaptchaToken: token }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const err = json?.error ?? "Failed to submit";
        throw new Error(err);
      }

      // Step 2: Send email via EmailJS from the browser (required - EmailJS is browser-only)
      await sendViaEmailJs(formData);

      formRef.current.reset();
      if (window.grecaptcha && widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
      setMessage("Thanks! We received your request and will reach out soon.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} className="formWrapper" onSubmit={onSubmit}>
      <div className="twoInputsWrapper">
        <div className="oneInputWrapper">
          <label htmlFor="request-name">Your Name</label>
          <input id="request-name" type="text" name="name" placeholder="John Smith" required />
        </div>
        <div className="oneInputWrapper">
          <label htmlFor="request-company">Company Name</label>
          <input id="request-company" type="text" name="company" placeholder="Skynet" />
        </div>
      </div>

      <div className="twoInputsWrapper">
        <div className="oneInputWrapper">
          <label htmlFor="request-email">Email</label>
          <input id="request-email" type="email" name="email" placeholder="john@skynet" required />
        </div>
        <div className="oneInputWrapper">
          <label htmlFor="request-phone">Phone</label>
          <input id="request-phone" type="tel" name="phone" placeholder="(555) 123- 7654" />
        </div>
      </div>

      <div className="twoInputsWrapper">
        <div className="oneInputWrapper">
          <label htmlFor="request-service">Service interested in</label>
          <select id="request-service" name="service">
            <option value="">Select service</option>
            {visibleServices.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="oneInputWrapper">
          <label htmlFor="request-location">Location type</label>
          <select id="request-location" name="location">
            <option value="">Select location</option>
            {locations.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor="request-description">Tell us about your needs</label>
      <textarea
        id="request-description"
        name="description"
        placeholder="How many employees or residents? Any specific requirements?"
        required
      />

      <div ref={captchaHostRef} style={{ display: "contents" }} />
      <button className="formButton" disabled={submitting}>
        {submitting ? "Sending..." : "Request Service"}
      </button>
      <p className="underFormText">No obligation. We'll reach out to discuss your needs.</p>
      {message ? <p className="text-center text-gray-500">{message}</p> : null}
    </form>
  );
}
