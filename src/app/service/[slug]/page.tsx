import ServiceSlugPage from "@/featured/pages/ServiceSlugPage";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ServiceSlugPage slug={slug} />;
}

