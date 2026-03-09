import { z } from "zod";

export const heroSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  image: z.string().startsWith("/uploads/"),
});

export const contentBlockSchema = z.object({
  layout: z.enum(["left", "right", "center"]),
  eyebrow: z.string().optional().default(""),
  heading: z.string().min(1),
  body: z.string().optional().default(""),
  iconSrc: z.string().optional().default(""),
  imageSrc: z.string().optional().default(""),
});

export const serviceSchema = z.object({
  slug: z.string().min(1),
  display: z.boolean().default(true),
  eyebrow: z.string().optional().default("service"),
  iconSrc: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  sectionsIntro: z.string().optional().default(""),
  heroImageSrc: z.string().min(1),
  blocks: z.array(contentBlockSchema).default([]),
});

export const locationSchema = z.object({
  slug: z.string().min(1),
  eyebrow: z.string().optional().default("location"),
  name: z.string().min(1),
  excerpt: z.string().optional().default(""),
  description: z.string().optional().default(""),
  iconKey: z.string().min(1).optional().default("FaMapMarkerAlt"),
  heroImageSrc: z.string().optional().default(""),
  blocks: z.array(contentBlockSchema).default([]),
});

export const testimonialSchema = z.object({
  id: z.string().min(1),
  locationSlug: z.string().min(1),
  quote: z.string().min(1),
  clientName: z.string().min(1),
  locationLabel: z.string().optional().default(""),
  enabled: z.boolean().optional().default(true),
  showOnHome: z.boolean().optional().default(true),
  showOnTestimonialsPage: z.boolean().optional().default(true),
  // Optional metadata for future imports (e.g., Google/Yelp)
  rating: z.number().min(1).max(5).optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
});

export const aboutSchema = z.object({
  eyebrow: z.string().optional().default(""),
  heroImageSrc: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  body: z.string().optional().default(""),
  imageSrc: z.string().optional().default(""),
}).default({ eyebrow: "", heroImageSrc: "", headline: "", body: "", imageSrc: "" });

export const cmsSchema = z.object({
  navbar: z.object({
    logoSrc: z.string().min(1),
    logoHref: z.string().min(1),
    links: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })),
    ctaLabel: z.string().min(1),
  }),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().min(1),
        enabled: z.boolean().optional().default(true),
      }),
    )
    .default([]),
  dynamicPages: z
    .object({
      services: z.boolean().default(true),
      locations: z.boolean().default(true),
    })
    .default({ services: true, locations: true }),
  home: z.object({
    hero: z.object({
      headline: z.string().min(1),
      body: z.string().min(1),
      ctaLabel: z.string().min(1),
      imageSrc: z.string().min(1),
    }),
    servicesIntro: z
      .object({
        eyebrow: z.string().optional().default(""),
        heading: z.string().min(1),
        body: z.string().optional().default(""),
      })
      .optional(),
    locationsIntro: z
      .object({
        eyebrow: z.string().optional().default(""),
        heading: z.string().min(1),
        body: z.string().optional().default(""),
      })
      .optional(),
    testimonialsIntro: z
      .object({
        eyebrow: z.string().optional().default(""),
        heading: z.string().min(1),
        body: z.string().optional().default(""),
      })
      .optional(),
    formIntro: z
      .object({
        eyebrow: z.string().optional().default(""),
        heading: z.string().min(1),
        body: z.string().optional().default(""),
      })
      .optional(),
  }),
  about: aboutSchema.optional().default({ eyebrow: "", heroImageSrc: "", headline: "", body: "", imageSrc: "" }),
  servicesListingText: z.string().optional().default(""),
  locationsListingText: z.string().optional().default(""),
  services: z.array(serviceSchema).default([]),
  locations: z.array(locationSchema).default([]),
  testimonials: z.array(testimonialSchema).default([]),
});
