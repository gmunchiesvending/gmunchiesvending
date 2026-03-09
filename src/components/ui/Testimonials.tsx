"use client";

import "./Testimonials.css";
import TestimonialCard from "@/components/ui/TestimonialCard";
import { titleCaseEyebrow } from "@/lib/text";

type Testimonial = {
  id: string;
  locationLabel: string;
  quote: string;
  clientName: string;
};

type TestimonialsProps = {
  intro?: {
    eyebrow?: string;
    heading: string;
    body?: string;
  };
  testimonials: Testimonial[];
};

export default function Testimonials({ intro, testimonials }: TestimonialsProps) {
  const loop = testimonials.length > 0 ? [...testimonials, ...testimonials] : [];

  return (
    <section className="section-full testimonialSection">
      <div className="testomonialWrapper">
        <div className="section-regular">
          <div className="headingWrapper">
            {intro?.eyebrow ? <p className="beforeHeading">{titleCaseEyebrow(intro.eyebrow)}</p> : null}
            <h2 className="h2">{intro?.heading ?? "Testimonials"}</h2>
            {intro?.body ? <p className="afterHeading">{intro.body}</p> : null}
          </div>
        </div>
        <div className="testimonialSlider">
          <div className="testimonialTrack">
            {loop.map((t, index) => (
              <div className="testimonialItem" key={`${t.id}-${index}`}>
                <TestimonialCard locationLabel={t.locationLabel} quote={t.quote} clientName={t.clientName} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

