"use client";

import { useEffect, useRef } from "react";
import "./Hero.css";
import Image from "next/image";

type HeroProps = {
  headline: string;
  body: string;
  ctaLabel: string;
  imageSrc: string;
};

export default function Hero({ headline, body, ctaLabel }: HeroProps) {
  const mascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!mascotRef.current) return;
      const y = window.scrollY;
      mascotRef.current.style.transform = `translateY(${y * 0.45}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    const formElement = document.getElementById("request-services-form");
    if (!formElement) return;

    const startPosition = window.pageYOffset;
    const targetPosition = formElement.getBoundingClientRect().top + startPosition - 80; // 80px offset for navbar
    const distance = targetPosition - startPosition;
    const duration = 800; // 800ms
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

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };



  return (
    <section className="section-full heroWrapper">
      <div className="heroBg" aria-hidden="true">
        <div ref={mascotRef} className="heroMascotParallax">
          <div className="heroMascotCircle" />
          <Image
            className="heroMascotImg"
            src="/uploads/mascot.svg"
            alt=""
            width={480}
            height={480}
            priority
          />
        </div>
      </div>

      <div className="CTA_Wrapper">
        <h1 className="heroHeading">{headline}</h1>
        <p className="heroDescription">{body}</p>
        <button className="ctaButton text-black" onClick={scrollToForm}>
          {ctaLabel}
        </button>
      </div>

      <div className="scrollContent"></div>
    </section>
  );
}
