import { test, expect } from "playwright/test";
import { RegisterPage } from "../pages/RegisterPage";
import {
  mockRegisterSuccess,
  mockRegisterError,
  mockRegisterWithDelay,
} from "../helpers/mock-api";

/**
 * Registration wizard E2E tests
 *
 * Suite A — Real API (requires backend + E2E_REGISTER_EMAIL_PREFIX in .env.e2e):
 *   - Full successful registration flow
 *
 * Suite B — Mocked network (no backend required):
 *   - Page rendering (Step 1 elements)
 *   - HTML native validation (empty submit)
 *   - Password mismatch validation
 *   - Step 1 Continue advances to Step 2 (client-side, no API)
 *   - Step 2 renders business data fields
 *   - Loading state during Step 2 submit
 *   - Successful registration advances to Step 3
 *   - Duplicate email (409) → error toast (tested in Step 2)
 *   - Rate limit (429) → specific error toast (tested in Step 2)
 *   - Go back button returns to Step 1
 *   - Go to login button redirects to /login?registered=true
 *   - Incoherent sessionStorage state → wizard resets to Step 1
 *   - Login link navigates to /es/login
 */

const VALID_FORM_DATA = {
  name: "Test User E2E",
  email: "e2e-register@test.com",
  phone: "3001234567",
  password: "Password123!",
  confirmPassword: "Password123!",
};

const VALID_BUSINESS_DATA = {
  businessName: "E2E Test Business",
  city: "Bogotá",
};

test.describe("Registration wizard", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
    registerPage = new RegisterPage(page);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Suite A — Real API
  // ─────────────────────────────────────────────────────────────────────────

  test.describe("real API", () => {
    test("successful full registration flow", async ({ page }) => {
      const emailPrefix = process.env.E2E_REGISTER_EMAIL_PREFIX;
      if (!emailPrefix) {
        test.skip(
          true,
          "Skipped: set E2E_REGISTER_EMAIL_PREFIX in .env.e2e to run this test"
        );
        return;
      }

      const uniqueEmail = `${emailPrefix}+${Date.now()}@test.com`;

      await registerPage.goto();
      await registerPage.fillStep1({
        ...VALID_FORM_DATA,
        email: uniqueEmail,
      });
      await registerPage.submitStep1();

      // Step 2 should appear
      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 5_000,
      });

      await registerPage.fillStep2(VALID_BUSINESS_DATA);
      await registerPage.submitStep2();

      // Step 3 — success confirmation
      await expect(registerPage.successHeading).toBeVisible({ timeout: 10_000 });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Suite B — Mocked network
  // ─────────────────────────────────────────────────────────────────────────

  test.describe("mocked network", () => {
    test("renders all required elements in step 1", async ({ page }) => {
      await registerPage.goto();

      await expect(registerPage.nameInput).toBeVisible();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.phoneInput).toBeVisible();
      await expect(registerPage.passwordInput).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toBeVisible();

      await expect(registerPage.continueStep1Button).toBeVisible();
      await expect(registerPage.continueStep1Button).toBeEnabled();

      await expect(page.getByText("+57")).toBeVisible();
      await expect(registerPage.loginLink).toBeVisible();
    });

    test("empty submit does not call the backend", async ({ page }) => {
      let registerCallCount = 0;
      await page.route(/\/auth\/register$/, (route) => {
        registerCallCount++;
        return route.continue();
      });

      await registerPage.goto();
      await registerPage.submitStep1();
      await page.waitForTimeout(400);

      expect(registerCallCount).toBe(0);
      await expect(page).toHaveURL(/\/es\/register/);
    });

    test("password mismatch shows error and disables submit", async ({
      page,
    }) => {
      await registerPage.goto();
      await registerPage.fillStep1({
        ...VALID_FORM_DATA,
        password: "Password123!",
        confirmPassword: "DifferentPass!",
      });

      const mismatchError = registerPage.getFieldError("Confirmar contraseña");
      await expect(mismatchError).toBeVisible();
      await expect(mismatchError).toContainText(/contraseñas no coinciden/i);

      await expect(registerPage.continueStep1Button).toBeDisabled();
    });

    test("step 1 continue advances to step 2 (client-side, no API call)", async ({
      page,
    }) => {
      let registerCallCount = 0;
      await page.route(/\/auth\/register$/, (route) => {
        registerCallCount++;
        return route.continue();
      });

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      // Step 2 must appear — no API call should have happened
      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });
      expect(registerCallCount).toBe(0);
    });

    test("step 2 renders business data fields", async ({ page }) => {
      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      await expect(registerPage.cityInput).toBeVisible();
      await expect(registerPage.createAccountButton).toBeVisible();
      await expect(registerPage.createAccountButton).toBeEnabled();
    });

    test("shows loading state during step 2 submit", async ({ page }) => {
      await mockRegisterWithDelay(page, 1500);

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      await registerPage.fillStep2(VALID_BUSINESS_DATA);
      await registerPage.submitStep2();

      await expect(registerPage.getStep2LoadingButton()).toBeVisible({
        timeout: 2_000,
      });
      await expect(registerPage.getStep2LoadingButton()).toBeDisabled();
    });

    test("mock: successful registration advances to step 3", async ({
      page,
    }) => {
      await mockRegisterSuccess(page);

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      await registerPage.fillStep2(VALID_BUSINESS_DATA);
      await registerPage.submitStep2();

      await expect(registerPage.successHeading).toBeVisible({ timeout: 5_000 });
    });

    test("mock: duplicate email (409) shows error toast", async ({ page }) => {
      await mockRegisterError(page, 409, "Email already registered");

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      await registerPage.fillStep2(VALID_BUSINESS_DATA);
      await registerPage.submitStep2();

      await expect(page.getByText(/email already registered/i)).toBeVisible({
        timeout: 5_000,
      });

      // User stays on Step 2
      await expect(registerPage.businessNameInput).toBeVisible();
    });

    test("mock: rate limit (429) shows specific toast", async ({ page }) => {
      await mockRegisterError(page, 429, "Too many requests");

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      await registerPage.fillStep2(VALID_BUSINESS_DATA);
      await registerPage.submitStep2();

      await expect(
        page.getByText(/demasiados intentos/i)
      ).toBeVisible({ timeout: 5_000 });
    });

    test("mock: go back button returns to step 1", async ({ page }) => {
      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });

      await registerPage.goBack();

      await expect(registerPage.nameInput).toBeVisible({ timeout: 3_000 });
    });

    test("mock: go to login after success navigates to /login?registered=true", async ({
      page,
    }) => {
      await mockRegisterSuccess(page);

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      await registerPage.fillStep2(VALID_BUSINESS_DATA);
      await registerPage.submitStep2();
      await expect(registerPage.successHeading).toBeVisible({ timeout: 5_000 });

      await registerPage.goToLogin();

      await page.waitForURL(/\/es\/login\?registered=true/, { timeout: 5_000 });
      await expect(page).toHaveURL(/\/es\/login\?registered=true/);
    });

    test("mock: incoherent sessionStorage state resets wizard to step 1", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const incoherentState = {
          state: {
            currentStep: 3,
            businessId: null,
            createdAt: null,
          },
          version: 0,
        };
        sessionStorage.setItem(
          "togo-registration-wizard",
          JSON.stringify(incoherentState)
        );
      });

      await registerPage.goto();

      await expect(registerPage.nameInput).toBeVisible({ timeout: 5_000 });
      await expect(registerPage.createAccountButton).not.toBeVisible();
      await expect(registerPage.successHeading).not.toBeVisible();
    });

    test("login link at the bottom navigates to /es/login", async ({
      page,
    }) => {
      await registerPage.goto();
      await registerPage.loginLink.click();
      await page.waitForURL(/\/es\/login/, { timeout: 5_000 });
      await expect(page).toHaveURL(/\/es\/login/);
    });
  });
});
