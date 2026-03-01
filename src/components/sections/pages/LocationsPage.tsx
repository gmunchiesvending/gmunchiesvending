import Locations from "@/components/sections/Locations";
import { getCmsContent } from "@/lib/content";

export default async function LocationsPage() {
  const cms = await getCmsContent();
  return (
    <main>
      <Locations intro={cms.home.locationsIntro} locations={cms.locations} enableLinks={cms.dynamicPages.locations} />
    </main>
  );
}

