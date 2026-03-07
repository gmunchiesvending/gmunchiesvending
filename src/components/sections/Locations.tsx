import "./Locations.css";
import LocationCard from "@/components/ui/LocationCard";
import Link from "next/link";
import { getIconByKey } from "@/lib/iconMap";

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
  enableLinks?: boolean;
};

export default function Locations({ intro, locations, enableLinks = true }: LocationsProps) {
  return (
    <section className="section-full locationSection">
      <div className="section-regular locationContainer">
        <div className="headingWrapper">
          {intro?.eyebrow ? <p className="beforeHeading">{intro.eyebrow}</p> : null}
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
      </div>
    </section>
  );
}
