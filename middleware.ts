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

  console.log("[Middleware] Path:", pathname);

  // Skip API routes
  if (pathname.startsWith("/api")) {
    console.log("[Middleware] Skipping API route");
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
  const refreshToken = request.cookies.get("togo_refresh_token")?.value;
  const hasCookie = !!refreshToken;

  console.log("[Middleware] Cookie present:", hasCookie);
  console.log("[Middleware] Cookie value:", refreshToken ? "[exists]" : "[none]");

  // Check route types
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  console.log("[Middleware] Is public route:", isPublicRoute);
  console.log("[Middleware] Is auth route:", isAuthRoute);

  // Check if there's a redirect parameter (indicates coming from auth failure)
  const hasRedirectParam = request.nextUrl.searchParams.has("redirect");

  // 1. Authenticated user trying to access auth route -> redirect to dashboard
  // BUT: Allow access if there's a redirect param (user was sent here due to auth failure)
  if (hasCookie && isAuthRoute && !hasRedirectParam) {
    console.log("[Middleware] Has cookie + auth route -> redirect to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Non-authenticated user trying to access protected route -> redirect to login
  if (!hasCookie && !isPublicRoute) {
    console.log("[Middleware] No cookie + protected route -> redirect to login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log("[Middleware] Allowing request");
  return NextResponse.next();
}
