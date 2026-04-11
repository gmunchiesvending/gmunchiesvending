import { notFound } from "next/navigation";
import { getCmsContent } from "@/lib/content";
import TestimonialCard from "@/components/ui/TestimonialCard";
import styles from "@/app/testimonials/page.module.css";

export default async function TestimonialsPage() {
  const cms = await getCmsContent();

  if (!cms.dynamicPages.testimonials) {
    notFound();
  }

  const testimonials = cms.testimonials.filter((t) => t.enabled && t.showOnTestimonialsPage);

  return (
    <main className="section-regular">
      <div className={styles.page}>
        <div className="headingWrapper">
          <p className="beforeHeading">Testimonials</p>
          <h1 className="h2">What people say</h1>
          <p className="afterHeading">Selected testimonials from our clients.</p>
        </div>

        <div className={styles.grid}>
          {testimonials.map((t, idx) => (
            <TestimonialCard key={`${t.id}-${idx}`} locationLabel={t.locationLabel} quote={t.quote} clientName={t.clientName} />
          ))}
        </div>
      </div>
    </main>
  );
}
