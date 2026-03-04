/**
 * Next.js Middleware
 * 
 * Handles route protection and authentication redirects
 * 
 * SECURITY MODEL:
 * - Reads refresh token from httpOnly cookie (togo_refresh_token)
 * - Access token is NOT checked here (it's in memory, client-side only)
 * - This provides SSR protection while keeping access token secure
 * 
 * Public routes: /login, /register, /forgot-password
 * Protected routes: All others
 * 
 * NOTE: This middleware runs in Edge Runtime and only checks cookie existence,
 * not token validity. Token validation happens client-side in AuthProvider.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Read refresh token from httpOnly cookie
  // NOTE: We only check existence, not validity (Edge Runtime limitation)
  const refreshToken = request.cookies.get("togo_refresh_token")?.value;
  const hasCookie = !!refreshToken;

  // Check route types
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Authenticated user trying to access auth route -> redirect to dashboard
  if (hasCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Non-authenticated user trying to access protected route -> redirect to login
  if (!hasCookie && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
