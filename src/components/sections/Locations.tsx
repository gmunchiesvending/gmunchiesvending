import "./Locations.css";
import LocationCard from "@/components/ui/LocationCard";
import Link from "next/link";
import { getIconByKey } from "@/lib/iconMap";
import { titleCaseEyebrow } from "@/lib/text";

type Location = {
  slug: string;
  name: string;
  excerpt?: string;
  description?: string;
  iconKey?: string;
};

type LocationsProps = {
  intro?: {
    eyebrow?: string;
    heading: string;
    body?: string;
  };
  locations: Location[];
  listingText?: string;
  enableLinks?: boolean;
};

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function Locations({ intro, locations, listingText = "", enableLinks = true }: LocationsProps) {
  const paras = splitParagraphs(listingText);
  return (
    <section className="section-full locationSection">
      <div className="section-regular locationContainer">
        <div className="headingWrapper">
          {intro?.eyebrow ? <p className="beforeHeading">{titleCaseEyebrow(intro.eyebrow)}</p> : null}
          <h2 className="h2">{intro?.heading ?? "Locations"}</h2>
          {intro?.body ? <p className="afterHeading">{intro.body}</p> : null}
        </div>
        <div className="locationGrid">
          {locations.map((location, index) => {
            const isLastAlone = index === locations.length - 1 && locations.length % 3 === 1;
            return enableLinks ? (
              <Link
                key={location.slug}
                href={`/location/${location.slug}`}
                className={`locationCardLink${isLastAlone ? " centerCard" : ""}`}
              >
                <LocationCard
                  name={location.name}
                  Icon={getIconByKey(location.iconKey)}
                  description={location.excerpt || location.description}
                />
              </Link>
            ) : (
              <div key={location.slug} className={`locationCardLink${isLastAlone ? " centerCard" : ""}`}>
                <LocationCard
                  name={location.name}
                  Icon={getIconByKey(location.iconKey)}
                  description={location.excerpt || location.description}
                />
              </div>
            );
          })}
        </div>
        {paras.length > 0 ? (
          <div className="locationsListingText">
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
