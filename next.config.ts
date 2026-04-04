import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // reCAPTCHA scripts + Next.js inline scripts
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
  // Next.js uses inline styles extensively
  "style-src 'self' 'unsafe-inline'",
  // reCAPTCHA badge image + self
  "img-src 'self' data: https://www.google.com https://www.gstatic.com",
  // reCAPTCHA + Google Maps embed iframes
  "frame-src https://www.google.com https://maps.google.com",
  // reCAPTCHA XHR
  "connect-src 'self' https://www.google.com",
  // next/font/google self-hosts fonts — no external font domain needed
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // HTTP → HTTPS
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: "https://www.gmunchiesvending.com/:path*",
        permanent: true,
      },
      // Canonicalize www -> apex so reCAPTCHA site key domain always matches.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.:domain*" }],
        destination: "https://:domain*/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
