"use client";

import "./ContentBlock.css";
import Image from "next/image";
import { useState } from "react";

export type ContentBlockData = {
  layout: "left" | "right" | "center";
  eyebrow?: string;
  heading: string;
  body?: string;
  iconSrc?: string;
  imageSrc?: string;
};

export default function ContentBlock({
  anchorId,
  layout,
  eyebrow,
  heading,
  body,
  imageSrc,
}: ContentBlockData & { anchorId?: string }) {
  const hasImage = Boolean(imageSrc && imageSrc.trim());
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <section
      id={anchorId}
      className={`contentBlock contentBlock--${layout}${hasImage ? "" : " contentBlock--noImage"}`}
    >
  
      <div className="contentBlockInner">
        <div className="contentBlockText">
          {eyebrow ? <p className="beforeHeading">{eyebrow}</p> : null}
          <h2 className="h2Left contentBlockHeading">{heading}</h2>
          {body ? <p className="contentBlockBody">{body}</p> : null}
        </div>

        {hasImage ? (
          <div className="contentBlockMedia" aria-hidden={!hasImage}>
            <div className="contentBlockMediaFrame">
              <div
                className={`contentBlockMediaParallax ${isLoaded ? "loaded" : ""}`}
              >
                <Image
                  src={imageSrc!}
                  alt={heading}
                  fill
                  className="contentBlockImage"
                  sizes="(max-width: 1000px) 100vw, 50vw"
                  onLoadingComplete={() => setIsLoaded(true)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

