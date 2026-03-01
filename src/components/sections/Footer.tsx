import "./Footer.css";
import Link from "next/link";
import Image from "next/image";

import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaYelp, FaGoogle } from "react-icons/fa";

type SocialLink = { platform: string; url: string; enabled?: boolean };

function iconForPlatform(platform: string) {
  const key = platform.trim().toLowerCase();
  if (key === "facebook") return FaFacebookF;
  if (key === "instagram") return FaInstagram;
  if (key === "linkedin") return FaLinkedinIn;
  if (key === "youtube") return FaYoutube;
  if (key === "yelp") return FaYelp;
  if (key === "google") return FaGoogle;
  return null;
}

export default function Footer({ socialLinks = [] }: { socialLinks?: SocialLink[] }) {
  const visible = socialLinks.filter((s) => s.enabled !== false && s.url);
  return (
    <footer className="section-full footerWrapper">
     
      <div className="footerContainer">
        {/* Logo and Company Info */}
        <div className="footerTop">
          <Link href="/" className="footerLogo">
            <Image
              src="/branding/logo.svg"
              alt="gmunchies logo"
              width={180}
              height={100}
              priority
              sizes="180px"
            />
          </Link>
          <div className="footerInfo">
            <p className="footerDescription">
              Your trusted vending partner delivering smart, reliable vending solutions 
              for offices and public spaces. Quality products, fast service, zero hassle.
            </p>
          </div>
        </div>

        {/* Social Media Links */}
        {visible.length > 0 ? (
          <div className="footerSocial">
            {visible.map((s) => {
              const Icon = iconForPlatform(s.platform);
              return (
                <a
                  key={`${s.platform}-${s.url}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="socialLink"
                  aria-label={s.platform}
                >
                  {Icon ? <Icon size={20} /> : <span style={{ fontWeight: 700 }}>{s.platform.slice(0, 1)}</span>}
                </a>
              );
            })}
          </div>
        ) : null}

        {/* Copyright */}
        <div className="footerCopyright">
          <p>&copy; {new Date().getFullYear()} GMunchies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}