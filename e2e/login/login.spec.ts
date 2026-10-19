import { test, expect } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import {
  mockLoginSuccess,
  mockLoginError,
  mockLoginWithDelay,
  mockLoginBackendSuccess,
  mockAuthenticatedSession,
} from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";

/**
 * Login page E2E tests
 *
 * Suite A — Real API (requires backend + credentials in .env.e2e):
 *   - Successful login with valid credentials
 *
 * Suite B — Mocked network (no backend required):
 *   - Correct page rendering
 *   - HTML native validation (empty / partial / malformed submit)
 *   - Invalid credentials (401) — field error + toast
 *   - User without permissions (403) — field error + toast
 *   - Validation error (422) and server error (500)
 *   - set-cookie failure keeps the user on login
 *   - Expired session redirect from protected route
 *   - Authenticated user visiting login is sent to dashboard
 *   - Loading state on submit + single request under double submit
 *   - Password masking and autocomplete attributes
 *   - Enter key submits the form
 *   - Navigation to forgot-password / register
 *   - session_expired query param (no-regression)
 *   - Language switcher (es → en and en → es)
 *   - Logout from dashboard returns to login
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

    test("partial submit (email only) does not call the backend", async ({
      page,
    }) => {
      let loginCallCount = 0;
      await page.route("**/v1/auth/login", (route) => {
        loginCallCount++;
        return route.continue();
      });

      await loginPage.goto();
      await loginPage.emailInput.fill("test@togo.com");

      // Password is required — native validation must block the submit
      await loginPage.submit();
      await page.waitForTimeout(400);

      expect(loginCallCount).toBe(0);
      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("partial submit (password only) does not call the backend", async ({
      page,
    }) => {
      let loginCallCount = 0;
      await page.route("**/v1/auth/login", (route) => {
        loginCallCount++;
        return route.continue();
      });

      await loginPage.goto();
      await loginPage.passwordInput.fill("password");

      // Email is required — native validation must block the submit
      await loginPage.submit();
      await page.waitForTimeout(400);

      expect(loginCallCount).toBe(0);
      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("malformed email does not call the backend", async ({ page }) => {
      let loginCallCount = 0;
      await page.route("**/v1/auth/login", (route) => {
        loginCallCount++;
        return route.continue();
      });

      await loginPage.goto();
      await loginPage.fillCredentials("not-an-email", "password");

      // type="email" native validation must block the submit
      await loginPage.submit();
      await page.waitForTimeout(400);

      expect(loginCallCount).toBe(0);
      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: validation error (422) shows backend message", async ({
      page,
    }) => {
      await mockLoginError(page, 422, "El correo no tiene un formato válido");

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.submit();

      await expect(loginPage.getEmailError()).toBeVisible();
      await expect(loginPage.getEmailError()).toContainText(
        "El correo no tiene un formato válido"
      );

      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: server error (500) shows backend message and stays on login", async ({
      page,
    }) => {
      await mockLoginError(page, 500, "Error interno del servidor");

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.submit();

      await expect(loginPage.getEmailError()).toBeVisible();
      await expect(loginPage.getEmailError()).toContainText(
        "Error interno del servidor"
      );

      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: set-cookie failure keeps user on login with error toast", async ({
      page,
    }) => {
      // Backend login succeeds but the session cookie cannot be set —
      // the user must NOT be treated as logged in.
      await mockLoginBackendSuccess(page);
      await page.route("**/api/auth/set-cookie", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Cookie error" }),
        })
      );

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.submit();

      // useLogin throws "Failed to set session cookie" → toast.error
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/failed to set session cookie/i)
      ).toBeVisible({ timeout: 5_000 });

      await expect(page).toHaveURL(/\/es\/login/);
    });

    test("mock: invalid credentials (401) also shows an error toast", async ({
      page,
    }) => {
      await mockLoginError(page, 401, "Credenciales incorrectas");

      await loginPage.goto();
      await loginPage.fillCredentials("wrong@example.com", "badpassword");
      await loginPage.submit();

      // Same message as the field error, but rendered inside the toast —
      // scope to sonner so the field error <p> does not collide.
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/credenciales incorrectas/i)
      ).toBeVisible({ timeout: 5_000 });
    });

    test("mock: user without permissions (403) also shows an error toast", async ({
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

      await expect(
        page.locator("li[data-sonner-toast]").getByText(/no tiene permisos/i)
      ).toBeVisible({ timeout: 5_000 });
    });

    test("mock: authenticated user visiting login is sent to dashboard", async ({
      page,
    }) => {
      // beforeEach cleared cookies — simulate a browser that already
      // holds a valid refresh cookie.
      await mockAuthenticatedSession(page);
      await mockOrdersDashboard(page);

      await page.goto("/es/login");

      await page.waitForURL(/\/es\/dashboard\/orders/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/es\/dashboard\/orders/);
    });

    test("mock: resubmit while loading sends exactly one login request", async ({
      page,
    }) => {
      let loginCallCount = 0;
      await page.route("**/v1/auth/login", async (route) => {
        loginCallCount++;
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });
      await page.route("**/api/auth/set-cookie", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.submit();

      // While pending the submit button is replaced by a disabled loading one
      await expect(loginPage.getLoadingButton()).toBeDisabled({
        timeout: 2_000,
      });

      // A second click attempt on the disabled loading button must not
      // issue another request (Playwright click times out on disabled
      // elements — swallow it, the assertion below is what matters).
      await loginPage
        .getLoadingButton()
        .click({ timeout: 1_000 })
        .catch(() => {});

      // Let the delayed backend call resolve, then verify a single request
      await page.waitForTimeout(2_000);
      expect(loginCallCount).toBe(1);
    });

    test("password field is masked with correct autocomplete attributes", async () => {
      await loginPage.goto();

      await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
      await expect(loginPage.passwordInput).toHaveAttribute(
        "autocomplete",
        "current-password"
      );
      await expect(loginPage.emailInput).toHaveAttribute(
        "autocomplete",
        "email"
      );

      // Typed value must not be exposed as plain text in the DOM
      await loginPage.passwordInput.fill("super-secret");
      await expect(loginPage.passwordInput).toHaveValue("super-secret");
      await expect(loginPage.passwordInput).toHaveAttribute(
        "type",
        "password"
      );
    });

    test("mock: Enter key submits the form", async ({ page }) => {
      await mockLoginSuccess(page);

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.passwordInput.press("Enter");

      await expect(page.getByText(/bienvenido/i)).toBeVisible({
        timeout: 5_000,
      });
      await loginPage.waitForDashboardRedirect();
    });

    test("language switcher changes locale from en to es", async ({
      page,
    }) => {
      await page.goto("/en/login");
      await page.getByLabel("Email address").waitFor({ state: "visible" });

      // Trigger shows the current language ("English") in the en locale
      await page.getByRole("button", { name: /english/i }).click();
      await page.getByRole("menuitem", { name: /español/i }).click();

      await page.waitForURL(/\/es\/login/, { timeout: 5_000 });
      await expect(page).toHaveURL(/\/es\/login/);

      // Labels are back in Spanish (proves i18n reload worked)
      await expect(page.getByLabel("Correo electrónico")).toBeVisible();
      await expect(page.getByLabel("Contraseña")).toBeVisible();
    });

    test("mock: logout from dashboard returns to login", async ({ page }) => {
      await mockLoginSuccess(page);
      await mockOrdersDashboard(page);

      await loginPage.goto();
      await loginPage.fillCredentials("test@togo.com", "password");
      await loginPage.submit();
      await loginPage.waitForDashboardRedirect();

      // Open the user menu in the sidebar (trigger shows the fake user name)
      await page.getByRole("button", { name: "Test User" }).click();
      await page.getByRole("menuitem", { name: /cerrar sesión/i }).click();

      // The real /api/auth/logout route clears the cookie (try/finally)
      // even with no backend, then the app navigates to login.
      await page.waitForURL(/\/es\/login/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/es\/login/);
      await expect(loginPage.emailInput).toBeVisible();
    });
  });
});
