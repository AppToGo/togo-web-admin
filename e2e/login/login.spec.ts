import { test, expect } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import {
  mockLoginSuccess,
  mockLoginError,
  mockLoginWithDelay,
} from "../helpers/mock-api";

/**
 * Login page E2E tests
 *
 * Suite A — Real API (requires backend + credentials in .env.e2e):
 *   - Successful login with valid credentials
 *
 * Suite B — Mocked network (no backend required):
 *   - Correct page rendering
 *   - HTML native validation (empty submit)
 *   - Invalid credentials (401)
 *   - User without permissions (403)
 *   - Expired session redirect from protected route
 *   - Loading state on submit
 *   - Navigation to forgot-password
 *   - session_expired query param (no-regression)
 */

test.describe("Login page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Start each test with a clean browser state
    await page.context().clearCookies();

    // Clear localStorage/sessionStorage BEFORE the first navigation so the
    // Zustand auth store (which persists user data under "togo-auth-storage")
    // does not leak between tests. addInitScript runs before every page load.
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    loginPage = new LoginPage(page);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Suite A — Real API
  // ─────────────────────────────────────────────────────────────────────────

  test.describe("real API", () => {
    test("successful login redirects to dashboard", async ({ page }) => {
      const email = process.env.E2E_TEST_EMAIL;
      const password = process.env.E2E_TEST_PASSWORD;

      if (!email || !password) {
        test.skip(
          true,
          "Skipped: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.e2e to run this test"
        );
        return;
      }

      await loginPage.goto();
      await loginPage.fillCredentials(email, password);
      await loginPage.submit();

      // Toast appears and the app redirects to dashboard
      await expect(page.getByText(/bienvenido/i)).toBeVisible({
        timeout: 10_000,
      });
      await loginPage.waitForDashboardRedirect();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Suite B — Mocked network
  // ─────────────────────────────────────────────────────────────────────────

  test.describe("mocked network", () => {
    test("renders all required elements", async ({ page }) => {
      await loginPage.goto();

      // Branding
      await expect(page.getByText("Bienvenido a Togo")).toBeVisible();

      // Card title
      await expect(
        page.getByRole("heading", { name: "Iniciar sesión" })
      ).toBeVisible();

      // Form fields — verified via accessible labels
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();

      // Submit button — enabled by default
      await expect(loginPage.submitButton).toBeVisible();
      await expect(loginPage.submitButton).toBeEnabled();

      // Forgot-password link
      await expect(loginPage.forgotPasswordLink).toBeVisible();
    });

    test("empty submit does not call the backend (HTML native validation)", async ({
      page,
    }) => {
      let loginCallCount = 0;
      await page.route("**/v1/auth/login", (route) => {
        loginCallCount++;
        return route.continue();
      });

      await loginPage.goto();

      // Submit without filling any field
      await loginPage.submit();

      // Browser native validation should prevent the fetch — wait briefly
      await page.waitForTimeout(400);

      expect(loginCallCount).toBe(0);
      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: invalid credentials (401) shows error under email field", async ({
      page,
    }) => {
      await mockLoginError(page, 401, "Credenciales incorrectas");

      await loginPage.goto();
      await loginPage.fillCredentials("wrong@example.com", "badpassword");
      await loginPage.submit();

      // Error message rendered by the Input component
      await expect(loginPage.getEmailError()).toBeVisible();
      await expect(loginPage.getEmailError()).toContainText(
        "Credenciales incorrectas"
      );

      // User stays on login
      await expect(page).toHaveURL(/\/es\/login/);

      // Email input is marked invalid (aria-invalid)
      await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
    });

    test("mock: user without permissions (403) shows error under email field", async ({
      page,
    }) => {
      await mockLoginError(
        page,
        403,
        "No tiene permisos para acceder al dashboard"
      );

      await loginPage.goto();
      await loginPage.fillCredentials("noaccess@example.com", "password123");
      await loginPage.submit();

      await expect(loginPage.getEmailError()).toBeVisible();
      await expect(loginPage.getEmailError()).toContainText(
        "No tiene permisos"
      );

      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: expired session redirects to login from protected route", async ({
      page,
    }) => {
      // beforeEach already cleared all cookies — no refresh token present.
      // The middleware detects the missing cookie and issues a server-side
      // 302 redirect to /es/login, which Playwright detects reliably.
      // (Client-side AuthProvider redirect is covered separately in integration.)
      await page.goto("/es/dashboard");

      await page.waitForURL(/\/es\/login/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: button shows loading state during submit", async ({ page }) => {
      // Backend responds after 1.5 s so we can observe the loading state
      await mockLoginWithDelay(page, 1500);

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");

      // Click submit — do NOT await full resolution
      await loginPage.submit();

      // Button must be in loading state immediately after click
      await expect(loginPage.getLoadingButton()).toBeVisible({ timeout: 2_000 });
      await expect(loginPage.getLoadingButton()).toBeDisabled();
    });

    test("navigating to forgot-password works", async ({ page }) => {
      await loginPage.goto();
      await loginPage.forgotPasswordLink.click();

      await page.waitForURL(/\/es\/forgot-password/, { timeout: 5_000 });
      await expect(page).toHaveURL(/\/es\/forgot-password/);
    });

    test("session_expired query param does not break the page", async ({
      page,
    }) => {
      // No special UI for this param yet — regression guard
      await page.goto("/es/login?session_expired=true");

      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      await expect(loginPage.submitButton).toBeEnabled();
    });

    test("navigating to register page works", async ({ page }) => {
      await loginPage.goto();

      await loginPage.registerLink.click();

      await page.waitForURL(/\/es\/register/, { timeout: 5_000 });
      await expect(page).toHaveURL(/\/es\/register/);
    });

    test("language switcher changes locale from es to en", async ({ page }) => {
      await loginPage.goto();

      // Open the LanguageSwitcher dropdown (Radix UI DropdownMenu)
      await loginPage.languageSwitcherTrigger.click();

      // Wait for the dropdown portal to appear and click the English option
      await loginPage.getLanguageOption("English").click();

      // next-intl rewrites the URL to /en/login — wait for navigation
      await page.waitForURL(/\/en\/login/, { timeout: 5_000 });
      await expect(page).toHaveURL(/\/en\/login/);

      // Verify labels switched to English (proves i18n reload worked)
      await expect(page.getByLabel("Email address")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign in/i })
      ).toBeVisible();
    });

    test("mock: successful login shows toast and redirects to dashboard", async ({
      page,
    }) => {
      await mockLoginSuccess(page);

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.submit();

      await expect(page.getByText(/bienvenido/i)).toBeVisible({
        timeout: 5_000,
      });
      await loginPage.waitForDashboardRedirect();
    });
  });
});
