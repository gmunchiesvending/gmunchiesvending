"use client";

import "./ContactForm.css";
import Image from "next/image";
import Form from "@/components/ui/Form";
import { titleCaseEyebrow } from "@/lib/text";

type ContactFormProps = {
  intro?: {
    eyebrow?: string;
    heading: string;
    body?: string;
  };
  services: { slug: string; title: string; display: boolean }[];
  locations: { slug: string; name: string }[];
  variant?: "page" | "footer";
};

export default function ContactForm({ intro, services, locations, variant = "page" }: ContactFormProps) {
  const Wrapper = (variant === "footer" ? "div" : "section") as any;
  return (
    <Wrapper
      id="request-services-form"
      className={variant === "footer" ? "footerRequestSection" : "section-full formSection"}
    >
      <div className={variant === "footer" ? "footerRequestInner" : "section-regular"}>
        <div className="headingWrapper">
          {intro?.eyebrow ? <p className="beforeHeading">{titleCaseEyebrow(intro.eyebrow)}</p> : null}
          <h2 className="h2">{intro?.heading ?? "Request Service Today"}</h2>
          {intro?.body ? <p className="afterHeading">{intro.body}</p> : null}
        </div>

        <div className="contactFormLayout">
            <Image
              className="contactFormMascot"
              src="/branding/mascot.svg"
              alt=""
              width={560}
              height={560}
              priority={false}
            />
          <div className="contactFormFormCol">
            <Form services={services} locations={locations} />
          </div>
          <div className="contactFormMascotCol" aria-hidden="true">
          </div>
        </div>
      </div>
    </Wrapper>
  );
}