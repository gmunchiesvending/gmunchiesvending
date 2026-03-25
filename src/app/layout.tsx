import type { Metadata } from "next";
import { Inter, Poppins } from 'next/font/google';
import "./globals.css";
import SiteChrome from "@/components/sections/SiteChrome";
import SiteJsonLd from "@/components/SiteJsonLd";


// Configure Inter for Body
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', 
});

// Configure Poppins for Headings
const poppins = Poppins({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins', 
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gmunchiesvending.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "GMunchies Vending",
  title: {
    default: "Rio Grande Valley Vending Services | No Cost Setup",
    template: "%s | GMunchies Vending",
  },
  description:
    "Reliable vending services across the Rio Grande Valley. We provide snack, beverage, and micro-market solutions with no-cost installation and ongoing support.",
  keywords: [
    "vending machines",
    "Rio Grande Valley vending",
    "office vending",
    "snack vending",
    "drink vending",
    "micro market",
    "McAllen vending",
    "GMunchies",
    "no cost vending",
    "free vending installation",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "GMunchies Vending",
    title: "Rio Grande Valley Vending Services | No Cost Setup",
    description:
      "Reliable vending services across the Rio Grande Valley. We provide snack, beverage, and micro-market solutions with no-cost installation and ongoing support.",
    images: [{ url: "/branding/logo.svg", width: 180, height: 100, alt: "GMunchies Vending" }],
  },
  twitter: {
    card: "summary",
    title: "Rio Grande Valley Vending Services | No Cost Setup",
    description:
      "Reliable vending services across the Rio Grande Valley. We provide snack, beverage, and micro-market solutions with no-cost installation and ongoing support.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SiteJsonLd />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
