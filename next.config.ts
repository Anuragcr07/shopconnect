import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ FIX: This tells Next.js to ignore these packages during bundling, 
  // which fixes the "TypeError: utils.typeOf is not a function" error.
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    unoptimized: true,
  },

  // ✅ React Compiler usually belongs in experimental
  experimental: {
    // Add supported experimental options here if needed
  },
};

export default nextConfig;