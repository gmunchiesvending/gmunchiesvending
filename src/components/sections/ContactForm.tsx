"use client";

import "./ContactForm.css";
import Image from "next/image";
import Form from "@/components/ui/Form";

type ContactFormProps = {
  intro?: {
    eyebrow?: string;
    heading: string;
    body?: string;
  };
  services: { slug: string; title: string; display: boolean }[];
  locations: { slug: string; name: string }[];
};

export default function ContactForm({ intro, services, locations }: ContactFormProps) {
  return (
    <section id="request-services-form" className="section-full formSection">
      <div className="section-regular">
        <div className="headingWrapper">
          {intro?.eyebrow ? <p className="beforeHeading">{intro.eyebrow}</p> : null}
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
    </section>
  );
}