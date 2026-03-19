import "./ContactUsPage.css";
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
              Have a question or interested in any of our vending services? Get in touch by filling out the form below or contacting us directly via email or phone. To request service, simply complete one of our Request Service forms available throughout the site.
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
              <div className="contactUsDetails">
                <div className="contactUsItem">
                  <span className="contactUsIcon" aria-hidden="true">
                    <MdEmail size={20} />
                  </span>
                  <a href={`mailto:${email}`} className="contactUsLink">
                    {email}
                  </a>
                </div>
                <div className="contactUsItem">
                  <span className="contactUsIcon" aria-hidden="true">
                    <MdPhone size={20} />
                  </span>
                  <a href={`tel:${phoneHref}`} className="contactUsLink">
                    {phoneDisplay}
                  </a>
                </div>
                <div className="contactUsItem">
                  <span className="contactUsIcon" aria-hidden="true">
                    <MdPlace size={20} />
                  </span>
                  <p className="contactUsText">Rio Grande Valley, Texas</p>
                </div>
              </div>

              <div className="contactUsMapFrame">
                <iframe
                  title="Rio Grande Valley service area map"
                  src="https://www.google.com/maps?q=26.194706,-98.1440501&z=10&output=embed"
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

