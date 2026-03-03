import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Canonicalize www -> apex so reCAPTCHA site key domain always matches.
      // If you prefer apex -> www instead, tell me and I’ll flip this.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.:domain*" }],
        destination: "https://:domain*/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
