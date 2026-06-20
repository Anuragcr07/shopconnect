// next.config.ts
// SECURITY FIX: Added comprehensive HTTP security headers
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  serverExternalPackages: [
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "sharp",
  ],

  // ✅ SECURITY FIX: Add security headers to every response
  async headers() {
    return [
      {
        source: "/(.*)", // Apply to ALL routes
        headers: [
          // Prevents browsers from MIME-sniffing responses — stops uploaded files
          // from being executed as JS
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevents your pages from being embedded in iframes (Clickjacking)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Forces HTTPS for 1 year — never fall back to HTTP
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Controls how much referrer info is sent to third parties
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disables browser features you don't need
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          // Content Security Policy — restricts what scripts/styles can load
          // IMPORTANT: Adjust 'script-src' if you add third-party scripts later
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // next.js needs 'unsafe-inline' and 'unsafe-eval' in dev; tighten for prod if possible
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://source.unsplash.com",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  experimental: {},
};

export default nextConfig;