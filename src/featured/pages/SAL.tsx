"use client";

import "./SAL.css";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ContentBlock, { type ContentBlockData } from "@/components/ui/ContentBlock";
import TestimonialCard from "@/components/ui/TestimonialCard";
import SectionJumpCard from "@/components/ui/SectionJumpCard";
import { titleCaseEyebrow } from "@/lib/text";

type Testimonial = {
  id: string;
  locationSlug: string;
  quote: string;
  clientName: string;
  locationLabel?: string;
};

type SALProps = {
  kind: "service" | "location";
  slug: string;
  eyebrow: string;
  title: string;
  description?: string;
  heroImageSrc?: string;
  blocks: ContentBlockData[];
  testimonials?: Testimonial[];
};

export default function SAL({
  kind,
  slug,
  eyebrow,
  title,
  description,
  heroImageSrc,
  blocks,
  testimonials = [],
}: SALProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      if (!imgRef.current) return;
      const scrollY = window.scrollY;
      imgRef.current.style.transform = `translateY(${scrollY * 0.55}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoaded]);

  const smoothScrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const startPosition = window.pageYOffset;
    const targetPosition = el.getBoundingClientRect().top + startPosition - 90; // offset for fixed nav
    const distance = targetPosition - startPosition;
    const duration = 650;
    let start: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startPosition + distance * ease);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  const navItems = blocks
    .map((b, idx) => ({
      idx,
      iconSrc: b.iconSrc,
      title: b.heading,
      anchorId: `${kind}-${slug}-section-${idx}`,
    }))
    .filter((x) => Boolean(x.iconSrc));

  const stripeClass = (index: number) => (index % 2 === 0 ? "salStripA" : "salStripB");
  const firstContentIndex = navItems.length > 0 ? 1 : 0;

  return (
    <main>
      <section className="section-full salHeroWrapper">
        {heroImageSrc ? (
          <div ref={imgRef} className={`salParallaxWrapper ${isLoaded ? "loaded" : ""}`}>
            <Image
              className="salHeroImg"
              src={heroImageSrc}
              alt={title}
              fill
              priority
              quality={65}
              onLoadingComplete={() => setIsLoaded(true)}
            />
          </div>
        ) : null}

        <div className="salCTAWrapper">
          <p className="beforeHeading">{titleCaseEyebrow(eyebrow)}</p>
          <h1 className="salHeroHeading">{title}</h1>
          {description ? <p className="salHeroDescription">{description}</p> : null}
        </div>
      </section>

      {navItems.length > 0 ? (
        <section className={`section-full salStrip ${stripeClass(0)} salSectionNavStrip`}>
          <div className="section-regular">
            <h3 className="salHeading">Our {title} services</h3>
            <div className="salSectionNavGrid" aria-label="Jump to sections">
              {navItems.map((n) => (
                <SectionJumpCard
                  key={n.anchorId}
                  iconSrc={n.iconSrc!}
                  title={n.title}
                  onClick={() => smoothScrollToId(n.anchorId)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {blocks.map((b, idx) => {
        const sectionIndex = firstContentIndex + idx;
        return (
          <section key={idx} className={`section-full salStrip ${stripeClass(sectionIndex)}`}>
            <div className="section-regular">
              <ContentBlock
                anchorId={`${kind}-${slug}-section-${idx}`}
                layout={b.layout}
                eyebrow={b.eyebrow}
                heading={b.heading}
                body={b.body}
                imageSrc={b.imageSrc}
              />
            </div>
          </section>
        );
      })}

      {kind === "location" && testimonials.length > 0 ? (
        <section className={`section-full salStrip ${stripeClass(firstContentIndex + blocks.length)}`}>
          <div className="section-regular">
            <div className="headingWrapper">
              <p className="beforeHeading">reviews</p>
              <h2 className="h2">What people say</h2>
            </div>

            <div className="salTestimonialsGrid">
              {testimonials.map((t) => (
                <TestimonialCard
                  key={t.id}
                  locationLabel={t.locationLabel || title}
                  quote={t.quote}
                  clientName={t.clientName}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

