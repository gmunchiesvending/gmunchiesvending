import Services from "@/components/sections/Services";
import { getCmsContent } from "@/lib/content";

export default async function ServicesPage() {
  const cms = await getCmsContent();
  return (
    <main>
      <Services intro={cms.home.servicesIntro} services={cms.services} enableLinks={cms.dynamicPages.services} />
    </main>
  );
}

