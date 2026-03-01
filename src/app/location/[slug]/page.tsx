import LocationSlugPage from "@/components/sections/pages/LocationSlugPage";

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LocationSlugPage slug={slug} />;
}

