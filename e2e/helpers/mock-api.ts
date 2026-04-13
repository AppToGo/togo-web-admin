import { type Page } from "playwright/test";

/**
 * Network mocking helpers for E2E tests.
 *
 * The login flow involves TWO network calls:
 *   1. POST [glob]v1/auth/login   - external backend via Axios (APP_CONFIG.api.baseUrl)
 *   2. POST /api/auth/set-cookie  - internal Next.js API route via fetch
 *
 * Both must be intercepted for a fully mocked successful login.
 *
 * IMPORTANT — cookie timing:
 * The refresh token cookie must be injected INSIDE the set-cookie route handler,
 * not upfront. If the cookie is present before loginPage.goto(), the Next.js
 * middleware sees it and redirects the user directly to /dashboard, skipping
 * the login form entirely.
 *
 * For the token-expired scenario:
 *   POST /api/auth/refresh - internal Next.js API route called by AuthProvider
 */

/** Fake LoginResponse used across success mocks */
const FAKE_LOGIN_RESPONSE = {
  access_token: "e2e-fake-access-token",
  refresh_token: "e2e-fake-refresh-token",
  expires_in: 3600,
  user: {
    userId: "e2e-test-user-id",
    email: "test@togo.com",
    name: "Test User",
    role: "ADMIN",
    businessId: "e2e-test-business-id",
    businessName: "Test Business",
    operatorProfileId: null,
    subscriptionPlan: 1,
  },
};

const FAKE_REFRESH_TOKEN_COOKIE = {
  name: "togo_refresh_token",
  value: "e2e-fake-refresh-token",
  domain: "localhost",
  path: "/",
  httpOnly: true,
  secure: false,
  sameSite: "Lax" as const,
};

/**
 * Mock a successful login.
 *
 * Intercepts the backend login endpoint AND the set-cookie API route.
 * The refresh token cookie is injected inside the set-cookie handler so that
 * it is NOT present when loginPage.goto() runs — this prevents the middleware
 * from redirecting to dashboard before the form is even shown.
 *
 * After onSuccess fires, the Zustand store holds the access token in memory,
 * and the cookie is set, so navigation to /dashboard succeeds.
 */
export async function mockLoginSuccess(page: Page): Promise<void> {
  // Intercept external backend call (Axios)
  await page.route("**/v1/auth/login", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FAKE_LOGIN_RESPONSE),
    })
  );

  // Intercept internal Next.js API route (fetch from useLogin hook).
  // Cookie is injected here — only AFTER the login has been submitted —
  // so the middleware does not see it during the initial goto("/es/login").
  await page.route("**/api/auth/set-cookie", async (route) => {
    await page.context().addCookies([FAKE_REFRESH_TOKEN_COOKIE]);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Mock a failed login response.
 *
 * @param status - HTTP status code (401 for invalid credentials, 403 for forbidden)
 * @param message - Error message returned by the backend
 */
export async function mockLoginError(
  page: Page,
  status: 401 | 403 | 422 | 500,
  message: string
): Promise<void> {
  await page.route("**/v1/auth/login", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ message, statusCode: status }),
    })
  );
}

/**
 * Mock a slow login response to test the loading state.
 * Adds an artificial delay before resolving the backend call.
 * Cookie is injected inside the set-cookie handler (same timing as mockLoginSuccess).
 *
 * @param delayMs - Milliseconds to wait before resolving (default: 1500ms)
 */
export async function mockLoginWithDelay(
  page: Page,
  delayMs = 1500
): Promise<void> {
  await page.route("**/v1/auth/login", async (route) => {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FAKE_LOGIN_RESPONSE),
    });
  });

  // Cookie injected inside the handler — not upfront
  await page.route("**/api/auth/set-cookie", async (route) => {
    await page.context().addCookies([FAKE_REFRESH_TOKEN_COOKIE]);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Simulate an expired session: cookie is present (middleware lets through),
 * but the refresh endpoint returns 401 so AuthProvider's catch calls
 * clearAuth() and then calls router.replace() to redirect to /login.
 *
 * NOTE: In practice, the simplest way to assert "protected route → login
 * redirect" in E2E tests is to navigate WITHOUT any cookie — the middleware
 * then issues a guaranteed server-side 302 redirect that Playwright detects
 * reliably. This helper is provided for scenarios where the AuthProvider's
 * client-side expired-token handling specifically needs to be verified.
 */
export async function mockExpiredSession(page: Page): Promise<void> {
  // Add an expired cookie so the middleware allows access to protected routes
  await page.context().addCookies([
    {
      ...FAKE_REFRESH_TOKEN_COOKIE,
      value: "expired-refresh-token",
    },
  ]);

  // Intercept the refresh request and return 401 — AuthProvider's else-if
  // branch calls clearAuth() and returns { success: false, token: null },
  // which triggers router.replace() to /login.
  await page.route(/\/api\/auth\/refresh/, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Token expired" }),
    })
  );
}
