"use client";

import "./AboutPreview.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type AboutPreviewProps = {
  eyebrow: string;
  headline: string;
  body: string;
  imageSrc: string;
};

export default function AboutPreview({ eyebrow, headline, body, imageSrc }: AboutPreviewProps) {
  const preview = body.length > 300 ? body.slice(0, 300).trimEnd() + "…" : body;
  const hasMore = body.length > 300;
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <section className="section-regular aboutPreview">
      <div className="aboutPreviewInner">
        <div className="aboutPreviewText">
          {eyebrow ? <p className="beforeHeading">{eyebrow}</p> : null}
          <h2 className="aboutPreviewHeading">{headline}</h2>
          <p className="aboutPreviewBody">{preview}</p>
          {hasMore ? (
            <Link href="/about" className="view-more" aria-label="Read more about us">
              Read more
            </Link>
          ) : null}
        </div>

        {imageSrc ? (
          <div className="aboutPreviewMedia">
            <div className="aboutPreviewFrame">
              <Image
                src={imageSrc}
                alt={headline}
                fill
                className={`aboutPreviewImg ${imgLoaded ? "loaded" : ""}`}
                sizes="(max-width: 1000px) 100vw, 50vw"
                onLoad={() => setImgLoaded(true)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
