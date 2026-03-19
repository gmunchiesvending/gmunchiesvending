import "./ContactUsPage.css";
import Link from "next/link";
import { MdEmail, MdPhone, MdPlace } from "react-icons/md";
import { getCmsContent } from "@/lib/content";
import Form from "@/components/ui/Form";

export default async function ContactUsPage() {
  const cms = await getCmsContent();
  const email = "gmunchiesvending@gmail.com";
  const phoneDisplay = "(956) 446-0262";
  const phoneHref = "+19564460262";

  return (
    <main>
      <section className="section-full contactUsSection">
        <div className="section-regular contactUsInner">
          <div className="headingWrapper">
            <h1 className="h1">Contact Us</h1>
            <p className="afterHeading">
              Have a question or interested in any of our vending services? Contact GMunchies Vending directly via email or phone using the information below. To place a service request, please complete the{" "}
              <Link href="/#request-services-form" className="contactUsInlineLink">
                Request Service
              </Link>{" "}
              form at the bottom of our homepage.
            </p>
          </div>

          <div className="contactUsGrid">
            <div className="contactUsFormCard">
              <Form
                services={cms.services}
                locations={cms.locations}
                source="contact-us"
                submitLabel="Send Message"
              />
            </div>

            <div className="contactUsInfoCard">
              <div className="contactUsItem">
                <span className="contactUsIcon" aria-hidden="true">
                  <MdEmail size={22} />
                </span>
                <div>
                  <h2 className="h3">Email</h2>
                  <Link href={`mailto:${email}`} className="contactUsLink">
                    {email}
                  </Link>
                </div>
              </div>

              <div className="contactUsItem">
                <span className="contactUsIcon" aria-hidden="true">
                  <MdPhone size={22} />
                </span>
                <div>
                  <h2 className="h3">Phone</h2>
                  <Link href={`tel:${phoneHref}`} className="contactUsLink">
                    {phoneDisplay}
                  </Link>
                </div>
              </div>

              <div className="contactUsItem">
                <span className="contactUsIcon" aria-hidden="true">
                  <MdPlace size={22} />
                </span>
                <div>
                  <h2 className="h3">Service Area</h2>
                  <p className="contactUsText">Rio Grande Valley, Texas</p>
                </div>
              </div>

              <div className="contactUsMapFrame">
                <iframe
                  title="Rio Grande Valley service area map"
                  src="https://www.google.com/maps?q=rio+grande+valley&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="contactUsCaption">
                Proudly serving businesses throughout the Rio Grande Valley.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

