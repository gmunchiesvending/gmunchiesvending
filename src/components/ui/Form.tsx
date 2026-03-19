"use client";

import "./Form.css";
import { useRef, useState } from "react";

type FormProps = {
  services: { slug: string; title: string; display: boolean }[];
  locations: { slug: string; name: string }[];
  source?: "request-service" | "contact-us";
  submitLabel?: string;
};

export default function Form({
  services,
  locations,
  source = "request-service",
  submitLabel = "Request Service",
}: FormProps) {
  const isContactUs = source === "contact-us";
  const visibleServices = services.filter((s) => s.display);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    if (submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const fd = new FormData(formRef.current);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          lastName: String(fd.get("lastName") ?? ""),
          company: String(fd.get("company") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          service: String(fd.get("service") ?? ""),
          location: String(fd.get("location") ?? ""),
          description: String(fd.get("description") ?? ""),
          source,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Failed to submit");

      formRef.current.reset();
      setResult({
        text:
          source === "contact-us"
            ? "Thanks! We received your message and will get back to you soon."
            : "Thanks! We received your request and will reach out soon.",
        ok: true,
      });
    } catch (err) {
      setResult({
        text: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        ok: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} className="formWrapper" onSubmit={onSubmit}>
      {isContactUs ? (
        <div className="formFieldsStack">
          <div className="oneInputWrapper">
            <label htmlFor="request-email">Email</label>
            <input id="request-email" type="email" name="email" placeholder="john@company.com" required />
          </div>

          <div className="twoInputsWrapper">
            <div className="oneInputWrapper">
              <label htmlFor="request-name">First Name</label>
              <input id="request-name" type="text" name="name" placeholder="John" required />
            </div>
            <div className="oneInputWrapper">
              <label htmlFor="request-last-name">Last Name</label>
              <input id="request-last-name" type="text" name="lastName" placeholder="Smith" required />
            </div>
          </div>

          <div className="oneInputWrapper">
            <label htmlFor="request-company">Company Name</label>
            <input id="request-company" type="text" name="company" placeholder="Acme Inc." />
          </div>
        </div>
      ) : (
        <div className="formFieldsStack">
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
              <input id="request-phone" type="tel" name="phone" placeholder="(555) 123-7654" />
            </div>
          </div>

          <div className="twoInputsWrapper">
            <div className="oneInputWrapper">
              <label htmlFor="request-service">Service interested in</label>
              <select id="request-service" name="service">
                <option value="">Select service</option>
                {visibleServices.map((s, idx) => (
                  <option key={`${s.slug}-${idx}`} value={s.slug}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="oneInputWrapper">
              <label htmlFor="request-location">Location type</label>
              <select id="request-location" name="location">
                <option value="">Select location</option>
                {locations.map((l, idx) => (
                  <option key={`${l.slug}-${idx}`} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <label htmlFor="request-description">{isContactUs ? "Message" : "Tell us about your needs"}</label>
      <textarea
        id="request-description"
        name="description"
        placeholder={
          isContactUs
            ? "Tell us how we can help."
            : "How many employees or residents? Any specific requirements?"
        }
        required
      />

      <button className="formButton" disabled={submitting}>
        {submitting ? "Sending..." : submitLabel}
      </button>
      <p className="underFormText">No obligation. We'll reach out to discuss your needs.</p>

      {result ? (
        <p className={result.ok ? "formMessageSuccess" : "formMessageError"}>{result.text}</p>
      ) : null}

      <p className="recaptchaTerms">
        This site is protected by reCAPTCHA and the Google{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>{" "}
        apply.
      </p>
    </form>
  );
}
