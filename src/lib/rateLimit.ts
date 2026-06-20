// src/lib/rateLimit.ts
// SECURITY FIX: Rate limiting for login and signup endpoints
// Uses @upstash/redis which is already in your package.json dependencies

import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Redis client using your existing Upstash env vars
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RateLimitConfig {
  maxRequests: number;   // How many requests allowed
  windowSeconds: number; // Time window in seconds
  keyPrefix: string;     // Namespace (e.g. "login" or "signup")
}

/**
 * Rate limit a request by IP address.
 * Returns { success: true } if allowed, or a NextResponse 429 if blocked.
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ success: true } | NextResponse> {
  // Get the real IP — Render sets x-forwarded-for
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `rate:${config.keyPrefix}:${ip}`;

  // Increment the counter and set TTL atomically
  const requests = await redis.incr(key);

  if (requests === 1) {
    // First request — set the expiry window
    await redis.expire(key, config.windowSeconds);
  }

  if (requests > config.maxRequests) {
    const ttl = await redis.ttl(key);
    return NextResponse.json(
      {
        message: `Too many attempts. Please try again in ${Math.ceil(ttl / 60)} minute(s).`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(ttl),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + ttl * 1000),
        },
      }
    );
  }

  return { success: true };
}

// Pre-configured limiters — import these directly in your routes

/** Login: max 5 attempts per 15 minutes per IP */
export const loginRateLimitConfig: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 15 * 60, // 15 minutes
  keyPrefix: "login",
};

/** Signup: max 3 accounts per hour per IP */
export const signupRateLimitConfig: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60, // 1 hour
  keyPrefix: "signup",
};

/** Email resend: max 3 per hour per IP */
export const emailRateLimitConfig: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
  keyPrefix: "email",
};