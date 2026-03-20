"use client";
import "./NavBar.css";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type NavLink = { label: string; href: string };
type ServiceOption = { slug: string; title: string; display: boolean };
type LocationOption = { slug: string; name: string };
type NavbarProps = {
  logoSrc: string;
  logoHref: string;
  links: NavLink[];
  ctaLabel: string;
  services: ServiceOption[];
  locations: LocationOption[];
  dynamicPages?: { services: boolean; locations: boolean };
};

export default function Navbar({
  logoSrc,
  logoHref,
  links,
  ctaLabel,
  services,
  locations,
  dynamicPages,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const servicesDynamic = dynamicPages?.services ?? true;
  const locationsDynamic = dynamicPages?.locations ?? true;

  // On contact pages there's no form on the page — navigate to the home form instead.
  const isContactRoute = /^\/contact(?:-us)?(?:\/|$)/.test(pathname ?? "");

  useEffect(() => {
    if (open) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }

    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  const scrollToForm = () => {
    setOpen(false);

    // On contact routes the form doesn't exist on the page — go to the home form.
    if (isContactRoute) {
      router.push("/#request-services-form");
      return;
    }

    const formElement = document.getElementById("request-services-form");
    if (!formElement) return;

    const startPosition = window.pageYOffset;
    const targetPosition = formElement.getBoundingClientRect().top + startPosition - 80;
    const distance = targetPosition - startPosition;
    const duration = 800;
    let start: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <header className="nav">
      <div className="nav-top">
        <Link href={logoHref} className="logo" onClick={closeMenu}>
          <Image
            src={logoSrc}
            alt="gmunchies logo"
            width={180}
            height={100}
            priority
            fetchPriority="high"
            sizes="180px"
          />
        </Link>

        <button
          className="burger"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      

      <nav className={`nav-menu ${open ? "open" : ""}`}>
        {links
          .filter((l) => !(l.href === "/services" && !servicesDynamic))
          .filter((l) => !(l.href === "/locations" && !locationsDynamic))
          .map((l, linkIdx) => {
          const isServices = l.href === "/services";
          const isLocations = l.href === "/locations";

          if (isServices) {
            if (!servicesDynamic) {
              return (
                <Link key={`${l.href}-${linkIdx}`} className="navLink" href={l.href} onClick={closeMenu}>
                  {l.label}
                </Link>
              );
            }
            return (
              <div key={`${l.href}-${linkIdx}`} className="navDropdown">
                <div className="navDropdownRow">
                  <Link
                    className="navLink navDropdownTrigger"
                    href={l.href}
                    onClick={() => {
                      // desktop: navigate; mobile: ok too
                      closeMenu();
                    }}
                  >
                    {l.label}
                  </Link>
                  <span className="navDropdownArrow" aria-hidden="true">
                    ›
                  </span>
                </div>

                <div className="navDropdownMenu" role="menu" aria-label="Services">
                  <Link className={`navDropdownItem${pathname === "/services" ? " active" : ""}`} href="/services" onClick={closeMenu} role="menuitem">
                    All services
                  </Link>
                  {services
                    .filter((s) => s.display)
                    .map((s, serviceIdx) => (
                      <Link
                        key={`${s.slug}-${serviceIdx}`}
                        className={`navDropdownItem${pathname === `/service/${s.slug}` ? " active" : ""}`}
                        href={`/service/${s.slug}`}
                        onClick={closeMenu}
                        role="menuitem"
                      >
                        {s.title}
                      </Link>
                    ))}
                </div>
              </div>
            );
          }

          if (isLocations) {
            if (!locationsDynamic) {
              return (
                <Link key={`${l.href}-${linkIdx}`} className="navLink" href={l.href} onClick={closeMenu}>
                  {l.label}
                </Link>
              );
            }
            return (
              <div key={`${l.href}-${linkIdx}`} className="navDropdown">
                <div className="navDropdownRow">
                  <Link
                    className="navLink navDropdownTrigger"
                    href={l.href}
                    onClick={() => {
                      closeMenu();
                    }}
                  >
                    {l.label}
                  </Link>
                  <span className="navDropdownArrow" aria-hidden="true">
                    ›
                  </span>
                </div>

                <div className="navDropdownMenu" role="menu" aria-label="Locations">
                  <Link className="navDropdownItem" href="/locations" onClick={closeMenu} role="menuitem">
                    All locations
                  </Link>
                  {locations.map((loc, locationIdx) => (
                    <Link
                      key={`${loc.slug}-${locationIdx}`}
                      className="navDropdownItem"
                      href={`/location/${loc.slug}`}
                      onClick={closeMenu}
                      role="menuitem"
                    >
                      {loc.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link key={`${l.href}-${linkIdx}`} className="navLink" href={l.href} onClick={closeMenu}>
              {l.label}
            </Link>
          );
        })}

        <button className="ctaButton" onClick={scrollToForm}>
          {ctaLabel}
        </button>
      </nav>
    </header>
  );
}
