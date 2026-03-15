"use client";

import "./AboutPage.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type AboutPageViewProps = {
  eyebrow: string;
  heroImageSrc: string;
  headline: string;
  body: string;
  imageSrc: string;
};

export default function AboutPageView({
  eyebrow,
  heroImageSrc,
  headline,
  body,
  imageSrc,
}: AboutPageViewProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      if (!imgRef.current) return;
      imgRef.current.style.transform = `translateY(${window.scrollY * 0.55}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoaded]);

  return (
    <main>
      {/* Hero */}
      <section className="section-full aboutHeroWrapper">
        {heroImageSrc ? (
          <div ref={imgRef} className={`aboutParallaxWrapper ${isLoaded ? "loaded" : ""}`}>
            <Image
              className="aboutHeroImg"
              src={heroImageSrc}
              alt={headline}
              fill
              priority
              quality={65}
              onLoad={() => setIsLoaded(true)}
            />
          </div>
        ) : (
          <div className="aboutHeroPlaceholder" aria-hidden />
        )}

        <div className="aboutCTAWrapper">
          {eyebrow ? <p className="beforeHeading aboutEyebrow">{eyebrow}</p> : null}
          <h1 className="aboutHeroHeading">{headline}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="section-regular aboutContentSection">
        <div className="aboutContent">
          {body ? (
            <div className="aboutBodyBlock">
              {body.split("\n\n").map((paragraph, i) => (
                <p key={i} className="aboutBodyText">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {imageSrc ? (
            <div className="aboutBodyImageWrapper">
              <div className="aboutBodyImageFrame">
                <Image
                  src={imageSrc}
                  alt={headline}
                  fill
                  className="aboutBodyImage"
                  sizes="(max-width: 1000px) 100vw, 900px"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
