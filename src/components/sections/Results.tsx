"use client";

import "./Results.css";
import ResultCard from "@/components/ui/ResultCard";
import { titleCaseEyebrow } from "@/lib/text";
import { getResultsIconByKey } from "@/lib/resultsIconMap";

type ResultsIntro = {
  eyebrow?: string;
  heading?: string;
  body?: string;
};

type ResultStat = {
  headline: string;
  target: number;
  iconKey: string;
};

export default function Results({
  intro,
  stats,
}: {
  intro?: ResultsIntro;
  stats?: ResultStat[];
}) {
  const eyebrow = intro?.eyebrow ?? "";
  const heading = intro?.heading ?? "";
  const body = intro?.body ?? "";
  const items = stats ?? [];

  const paragraphs = body
    .split(/\n\s*\n/g) // blank line => new paragraph
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="section-full rsfWrapper">
      <div className="section-regular">
        <div className="headingWrapper">
          {eyebrow ? <p className="beforeHeading">{titleCaseEyebrow(eyebrow)}</p> : null}
          {heading ? <h2 className="h2">{heading}</h2> : null}
          {paragraphs.length > 0 ? (
            <div className="afterHeading">
              {paragraphs.map((p, i) => (
                <p key={i} style={{ margin: 0 }}>
                  {p.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < p.split("\n").length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          ) : null}
      </div>

        <div className="rsCardsWrapper">
          {items.map((s, idx) => (
            <ResultCard
              key={`${s.headline}-${idx}`}
              headline={s.headline}
              target={s.target}
              Icon={getResultsIconByKey(s.iconKey)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
