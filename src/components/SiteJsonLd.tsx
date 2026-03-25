const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gmunchiesvending.com";

export default function SiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "GMunchies Vending",
        "description":
          "Smart, reliable vending solutions for offices and businesses across the Rio Grande Valley, TX.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/?s={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#business`,
        "name": "GMunchies Vending",
        "url": siteUrl,
        "logo": `${siteUrl}/branding/logo.svg`,
        "telephone": "+19564460262",
        "email": "gmunchiesvending@gmail.com",
        "areaServed": {
          "@type": "Place",
          "name": "Rio Grande Valley, Texas",
        },
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "TX",
          "addressCountry": "US",
        },
      },
      // SiteNavigationElement hints Google toward showing these as Sitelinks
      {
        "@type": "SiteNavigationElement",
        "name": "Services",
        "url": `${siteUrl}/services`,
      },
      {
        "@type": "SiteNavigationElement",
        "name": "About Us",
        "url": `${siteUrl}/about`,
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Request Service",
        "url": `${siteUrl}/#request-services-form`,
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Contact Us",
        "url": `${siteUrl}/contact-us`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
