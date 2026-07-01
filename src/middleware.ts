// src/middleware.ts  (place this in the src/ folder, or at root if no src/)
// SECURITY FIX: Protect routes, enforce auth, block unauthenticated API access

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require a logged-in user
const PROTECTED_ROUTES = [
  "/dashboard",
  "/customer",
  "/profile",
  "/chat",
  "/inquiry",
  "/shopkeeper",
];

// API routes that require auth (block if no valid session)
const PROTECTED_API_ROUTES = [
  "/api/chat",
  "/api/profile",
  "/api/inquiry",
  "/api/shopkeeper",
  "/api/customer",
  "/api/upload",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ SECURITY FIX: Verify JWT for protected page routes
  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedPage || isProtectedApi) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      if (isProtectedApi) {
        // ✅ SECURITY FIX: Return 401 for API calls without auth
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Redirect to login for page routes
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ✅ SECURITY FIX: Redirect already-logged-in users away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  const response = NextResponse.next();

  // ✅ SECURITY FIX: Add security headers at middleware level too
  // (belt-and-suspenders alongside next.config.ts headers)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  // Run on all routes except static files, images, and _next internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};