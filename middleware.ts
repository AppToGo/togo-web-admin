/**
 * Next.js Middleware
 *
 * Handles i18n routing and authentication redirects
 *
 * SECURITY MODEL:
 * - Reads refresh token from httpOnly cookie (togo_refresh_token)
 * - Access token is NOT checked here (it's in memory, client-side only)
 * - This provides SSR protection while keeping access token secure
 *
 * Public routes: /:locale/login, /:locale/register, /:locale/forgot-password
 * Protected routes: All others
 *
 * NOTE: This middleware runs in Edge Runtime and only checks cookie existence,
 * not token validity. Token validation happens client-side in AuthProvider.
 */

import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { locales } from "./i18n/config";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/legal"];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

// Create i18n middleware
const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Development-only debug logging
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log("[Middleware] Path:", pathname);
  }

  // Skip API routes
  if (pathname.startsWith("/api")) {
    if (isDev) {
      console.log("[Middleware] Skipping API route");
    }
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

  // Extract locale from path (e.g., /es/login -> es)
  // Only treat the first segment as locale if it's a known locale (es, en)
  const localeMatch = pathname.match(/^\/([^\/]+)(\/.*)?$/);
  const maybeLocale = localeMatch ? localeMatch[1] : null;
  const isKnownLocale = maybeLocale ? (locales as readonly string[]).includes(maybeLocale) : false;
  const locale = isKnownLocale ? maybeLocale : null;
  const pathWithoutLocale = isKnownLocale && localeMatch?.[2] ? localeMatch[2] : pathname;

  if (isDev) {
    console.log("[Middleware] Locale:", locale);
    console.log("[Middleware] Path without locale:", pathWithoutLocale);
  }

  // Read refresh token from httpOnly cookie
  const refreshToken = request.cookies.get("togo_refresh_token")?.value;
  const hasCookie = !!refreshToken;

  if (isDev) {
    console.log("[Middleware] Cookie present:", hasCookie);
    console.log(
      "[Middleware] Cookie value:",
      refreshToken ? "[exists]" : "[none]"
    );
  }

  // Check route types (using path without locale)
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  if (isDev) {
    console.log("[Middleware] Is public route:", isPublicRoute);
    console.log("[Middleware] Is auth route:", isAuthRoute);
  }

  // Check if there's a redirect parameter (indicates coming from auth failure)
  const hasRedirectParam = request.nextUrl.searchParams.has("redirect");

  // 1. Authenticated user trying to access auth route -> redirect to dashboard
  // BUT: Allow access if there's a redirect param (user was sent here due to auth failure)
  if (hasCookie && isAuthRoute && !hasRedirectParam && locale) {
    if (isDev) {
      console.log(
        "[Middleware] Has cookie + auth route -> redirect to dashboard"
      );
    }
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard/orders`, request.url)
    );
  }

  // 2. Non-authenticated user trying to access protected route -> redirect to login
  if (!hasCookie && !isPublicRoute && (locale || !isKnownLocale)) {
    if (isDev) {
      console.log(
        "[Middleware] No cookie + protected route -> redirect to login"
      );
    }
    const effectiveLocale = locale ?? "es";
    const loginUrl = new URL(`/${effectiveLocale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Handle i18n routing
  if (isDev) {
    console.log("[Middleware] Processing i18n routing");
  }
  return intlMiddleware(request);
}
