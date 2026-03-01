import { notFound } from "next/navigation";
import { getCmsContent } from "@/lib/content";
import SAL from "@/featured/pages/SAL";

export default async function LocationSlugPage({ slug }: { slug: string }) {
  const cms = await getCmsContent();

  const location = cms.locations.find((l) => l.slug === slug);
  if (!location) return notFound();

  const testimonials = cms.testimonials.filter((t) => t.enabled && t.locationSlug === slug);

  return (
    <SAL
      kind="location"
      slug={slug}
      eyebrow="location"
      title={location.name}
      description={location.description}
      heroImageSrc={location.heroImageSrc}
      blocks={location.blocks}
      testimonials={testimonials}
    />
  );
}
