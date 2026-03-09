import "./Services.css";
import ServiceCard from "@/components/ui/ServiceCard";
import { titleCaseEyebrow } from "@/lib/text";

type Service = {
  slug: string;
  display: boolean;
  iconSrc: string;
  title: string;
  excerpt: string;
};

type ServicesProps = {
  intro?: {
    eyebrow?: string;
    heading: string;
    body?: string;
  };
  listingText?: string;
  services: Service[];
  enableLinks?: boolean;
};

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function Services({ intro, listingText = "", services, enableLinks = true }: ServicesProps) {
  const visible = services.filter((s) => s.display);
  const paras = splitParagraphs(listingText);
  return (
    <section className="section-regular">
      <div className="headingWrapper">
        {intro?.eyebrow ? <p className="beforeHeading">{titleCaseEyebrow(intro.eyebrow)}</p> : null}
        <h2 className="h2">{intro?.heading ?? "Services"}</h2>
        {intro?.body ? <p className="afterHeading">{intro.body}</p> : null}
      </div>
      <div className="cardWrapper">
        {visible.map((service) => (
          <ServiceCard
            key={service.slug}
            img={service.iconSrc}
            headline={service.title}
            bodyText={service.excerpt}
            href={enableLinks ? `/service/${service.slug}` : undefined}
          />
        ))}
      </div>
      {paras.length > 0 ? (
        <div className="servicesListingText">
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
