import type { ReactNode } from "react";
import Navbar from "@/components/sections/NavBar";
import Footer from "@/components/sections/Footer";
import AdminAwareChrome from "@/components/sections/AdminAwareChrome";
import Providers from "@/components/sections/Providers";
import { getCmsContent } from "@/lib/content";

export default async function SiteChrome({ children }: { children: ReactNode }) {
  const cms = await getCmsContent();

  return (
    <AdminAwareChrome
      navbar={
        <Navbar
          logoSrc={cms.navbar.logoSrc}
          logoHref={cms.navbar.logoHref}
          links={cms.navbar.links}
          ctaLabel={cms.navbar.ctaLabel}
          services={cms.services}
          locations={cms.locations}
          dynamicPages={cms.dynamicPages}
        />
      }
      footer={
        <Footer
          socialLinks={cms.socialLinks}
          formIntro={cms.home.formIntro}
          services={cms.services}
          locations={cms.locations}
        />
      }
    >
      <Providers>{children}</Providers>
    </AdminAwareChrome>
  );
}

