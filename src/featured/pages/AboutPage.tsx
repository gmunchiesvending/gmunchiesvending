import { getCmsContent } from "@/lib/content";
import AboutPageView from "./AboutPageView";

export default async function AboutPage() {
  const cms = await getCmsContent();
  const about = cms.about;

  return (
    <AboutPageView
      eyebrow={about.eyebrow}
      heroImageSrc={about.heroImageSrc}
      headline={about.headline}
      body={about.body}
      imageSrc={about.imageSrc}
    />
  );
}
