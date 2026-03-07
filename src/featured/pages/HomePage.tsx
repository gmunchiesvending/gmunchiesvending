import Hero from "@/components/sections/Hero";
import AboutPreview from "@/components/sections/AboutPreview";
import Services from "@/components/sections/Services";
import Results from "@/components/sections/Results";
import Locations from "@/components/sections/Locations";
import ContactForm from "@/components/sections/ContactForm";
import Testimonials from "@/components/ui/Testimonials";
import { getCmsContent } from "@/lib/content";

export default async function HomePage() {
  const cms = await getCmsContent();
  const homeTestimonials = cms.testimonials.filter(
    (t) => t.enabled && t.showOnHome,
  );

  return (
    <main>
      <Hero
        headline={cms.home.hero.headline}
        body={cms.home.hero.body}
        ctaLabel={cms.home.hero.ctaLabel}
        imageSrc={cms.home.hero.imageSrc}
      />
      <Services
        intro={cms.home.servicesIntro}
        listingText={cms.servicesListingText}
        services={cms.services}
        enableLinks={cms.dynamicPages.services}
      />
      <AboutPreview
        eyebrow={cms.about.eyebrow}
        headline={cms.about.headline}
        body={cms.about.body}
        imageSrc={cms.about.imageSrc}
      />
      <Locations
        intro={cms.home.locationsIntro}
        listingText={cms.locationsListingText}
        locations={cms.locations}
        enableLinks={cms.dynamicPages.locations}
      />
      <Results />
      <Testimonials
        intro={cms.home.testimonialsIntro}
        testimonials={homeTestimonials}
      />

      <ContactForm
        intro={cms.home.formIntro}
        services={cms.services}
        locations={cms.locations}
      />
    </main>
  );
}
