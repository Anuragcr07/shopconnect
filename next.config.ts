import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    unoptimized: true, // ✅ Fixes the "sharp" installation error on Windows during SST deploy
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Added for your Cloudinary setup
      },
    ],
  },

  serverExternalPackages: [
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "sharp",
  ],

  experimental: {
  },
};

export default nextConfig;