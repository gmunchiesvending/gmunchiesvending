# GMunchies – Claude Code Project Instructions

> **READ THIS FILE ON ENTRY. UPDATE IT ON EXIT whenever structure or conventions change.**

## Stack

- **Next.js 16** (App Router), React 19, TypeScript strict mode
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **NextAuth.js v4** for admin authentication
- **Zod v4** for schema validation
- **Nodemailer** (installed, not currently used for email)
- **react-icons** for icons

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Home → featured/pages/HomePage
│   ├── about/page.tsx          # About → featured/pages/AboutPage
│   ├── contact-us/page.tsx     # Contact Us → featured/pages/ContactUsPage
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── location/[slug]/page.tsx   → featured/pages/LocationSlugPage
│   ├── locations/page.tsx         → featured/pages/LocationsPage
│   ├── service/[slug]/page.tsx    → featured/pages/ServiceSlugPage
│   ├── services/page.tsx          → featured/pages/ServicesPage
│   ├── testimonials/page.tsx      → featured/pages/TestimonialsPage
│   ├── admin/                  # Admin panel pages
│   └── api/
│       ├── auth/               # NextAuth routes
│       ├── admin/              # CMS API routes
│       └── contact/route.ts    # reCAPTCHA verification only (email sent client-side)
├── components/
│   ├── sections/               # Section-level UI components (NOT pages)
│   │   ├── Hero.tsx
│   │   ├── Services.tsx
│   │   ├── Locations.tsx
│   │   ├── Results.tsx
│   │   ├── ContactForm.tsx     # Wraps Form.tsx
│   │   ├── AboutPreview.tsx    # Home page about section (left text + right image + read more)
│   │   ├── Testemonials.tsx    # Note: typo in filename kept intentionally
│   │   ├── NavBar.tsx
│   │   ├── Footer.tsx
│   │   ├── SiteChrome.tsx
│   │   ├── AdminAwareChrome.tsx
│   │   └── Providers.tsx
│   └── ui/                     # Reusable UI primitives
│       ├── Form.tsx             # Contact form (client component, sends email via EmailJS)
│       ├── ContentBlock.tsx
│       ├── Heading.tsx
│       ├── LocationCard.tsx
│       ├── ResultCard.tsx
│       ├── SectionJumpCard.tsx
│       ├── ServiceCard.tsx
│       ├── TestimonialCard.tsx
│       ├── Testimonials.tsx
│       └── ViewMore.tsx
├── featured/
│   ├── pages/                  # Full page compositions (used by app router)
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx       # Server — fetches CMS, passes to AboutPageView
│   │   ├── AboutPageView.tsx   # Client — parallax hero + body + image
│   │   ├── AboutPage.css
│   │   ├── LocationSlugPage.tsx
│   │   ├── LocationsPage.tsx
│   │   ├── ServiceSlugPage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── TestimonialsPage.tsx
│   │   ├── SAL.tsx             # Service/Location detail template (client component)
│   │   └── SAL.css
│   └── admin/
│       ├── Admin.tsx
│       ├── Admin.css
│       └── Dashboard.tsx
├── content/
│   ├── data.json               # Main CMS data
│   └── pages/home.json
└── lib/
    ├── content.ts              # getCmsContent() helper
    ├── authOptions.ts
    ├── github.ts
    ├── iconMap.ts
    └── schemas.ts
```

## Key Conventions

### Component Organization Rule
- `components/sections/` — section-level UI pieces (Hero, NavBar, Footer, etc.). **No pages here.**
- `components/ui/` — reusable primitives (cards, form fields, etc.)
- `featured/pages/` — full page compositions imported by `app/*/page.tsx`
- `featured/admin/` — admin-specific compositions

### App Router → Page Component Mapping
Each `app/*/page.tsx` is a thin wrapper that just imports and renders from `featured/pages/`:
```tsx
import FooPage from "@/featured/pages/FooPage";
export default function Page() { return <FooPage />; }
```

### Email / Contact Form
- **`/api/contact`** – validates form data (Zod) + verifies reCAPTCHA + **sends email via EmailJS** — all server-side.
- EmailJS normally rejects server-side calls (403). The fix: the API forwards the browser's `Origin` header to the EmailJS fetch, so EmailJS sees a valid browser origin.
- **`Form.tsx`** – client component. Collects form data, gets reCAPTCHA token, POSTs to `/api/contact`. No EmailJS logic in the client.
- `NEXT_PUBLIC_EMAILJS_*` vars are read **server-side** in the API route (no build-time replacement issue). Do NOT move EmailJS back to client — `NEXT_PUBLIC_` vars in client code are replaced at build time and will be `undefined` if not set during the build.

### Required Environment Variables
```
# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=   # client-side site key
RECAPTCHA_SECRET_KEY=             # server-side secret (API route only)

# EmailJS — read server-side in /api/contact (NEXT_PUBLIC_ prefix kept for backwards compat,
# but these are only ever read on the server so build-time replacement doesn't apply)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
NEXT_PUBLIC_EMAILJS_PRIVATE_KEY=   # optional accessToken for extra security

# Local dev only (do NOT set on production)
SKIP_RECAPTCHA=true                # skips server-side reCAPTCHA check
NEXT_PUBLIC_SKIP_RECAPTCHA=true    # skips client-side reCAPTCHA widget

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Admin
ADMIN_USERNAME=
ADMIN_PASSWORD=

# GitHub (CMS storage)
GITHUB_TOKEN=
GITHUB_REPO=
GITHUB_BRANCH=
```

## Common Commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

## Update Protocol

**Whenever you change the project structure, component locations, conventions, or env vars:**
1. Update this `CLAUDE.md` to reflect the new state.
2. Update `~/.claude/projects/.../memory/MEMORY.md` if the project entry there is stale.

---

## Site Flow Scan

### Pages & Routes

| Route | Composition | Notes |
|---|---|---|
| `/` | `app/page.tsx` → `featured/pages/HomePage.tsx` | Home |
| `/about` | `app/about/page.tsx` → `featured/pages/AboutPage.tsx` → `AboutPageView.tsx` (client) | About page |
| `/contact-us` | `app/contact-us/page.tsx` → `featured/pages/ContactUsPage.tsx` | Contact form + contact info |
| `/services` | `app/services/page.tsx` → `featured/pages/ServicesPage.tsx` | Services listing |
| `/service/[slug]` | `app/service/[slug]/page.tsx` → `featured/pages/ServiceSlugPage.tsx` → `SAL.tsx` (client) | Service detail |
| `/locations` | `app/locations/page.tsx` → `featured/pages/LocationsPage.tsx` | Locations listing |
| `/location/[slug]` | `app/location/[slug]/page.tsx` → `featured/pages/LocationSlugPage.tsx` → `SAL.tsx` (client) | Location detail |
| `/testimonials` | `app/testimonials/page.tsx` → `featured/pages/TestimonialsPage.tsx` | Testimonials |
| `/admin` | `app/admin/page.tsx` → `featured/admin/Admin.tsx` → `Dashboard.tsx` (client) | CMS admin panel |

### Home Page Sections (order)

1. **Hero** — parallax image, headline, body, CTA scrolls to contact form
2. **AboutPreview** — left: headline + 300-char excerpt + "Read more →"; right: image
3. **Services** — intro + ServiceCard grid
4. **Locations** — intro + LocationCard grid
5. **Results** — static stats
6. **Testimonials** — intro + TestimonialCard grid
7. **ContactForm** — reCAPTCHA + EmailJS

### About Page Sections

1. **Hero** — parallax image (`aspect-ratio: 3/1`), centered eyebrow + headline
2. **Content** — centered body text + image (center layout)

### CMS data.json Top-Level Keys

| Key | Description |
|---|---|
| `navbar` | Logo src/href, links array, CTA label |
| `dynamicPages` | Feature flags: `services`, `locations` (bool) |
| `socialLinks` | Social platform links with `enabled` flag |
| `home` | hero, servicesIntro, locationsIntro, testimonialsIntro, formIntro |
| `about` | eyebrow, heroImageSrc, headline, body, imageSrc |
| `services` | Array of service objects with blocks[] |
| `locations` | Array of location objects with blocks[] |
| `testimonials` | Array of testimonial objects |

### Admin Panel Modes

`about` | `locations` | `services` | `testimonials` | `social`

### ContentBlock Layouts (used on service/location detail and about pages)

- `left` — text on right, image on left
- `right` — text on left, image on right
- `center` — text above, image below (stacked, centered)
