import { test, expect } from "playwright/test";
import { RegisterPage } from "../pages/RegisterPage";
import {
  mockRegisterSuccess,
  mockRegisterError,
  mockRegisterWithDelay,
  mockAuthenticatedSession,
} from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";

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
 *   - Malformed email in Step 1 does not advance (native validation)
 *   - Empty Step 2 submit does not call the backend
 *   - Department enables city; changing department resets city
 *   - Industries load from the backend into the select
 *   - Server error (500) → error toast, stays on Step 2
 *   - Step 3 shows free-plan info
 *   - Expired wizard session → resets to Step 1 (warning toast never
 *     fires — product bug, not asserted)
 *   - Authenticated user visiting register is sent to dashboard
 *   - Going back to Step 1 clears Step 1 data
 *   - Progress indicator shows all three steps
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
  department: "Bogotá D.C.",
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
    test("successful full registration flow", async () => {
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
    test("renders all required elements in step 1", async () => {
      await registerPage.goto();

      await expect(registerPage.nameInput).toBeVisible();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.phoneInput).toBeVisible();
      await expect(registerPage.passwordInput).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toBeVisible();

      await expect(registerPage.continueStep1Button).toBeVisible();
      await expect(registerPage.continueStep1Button).toBeEnabled();

      // Country-code trigger defaults to Colombia (+57). Scoped to the
      // trigger itself: the Radix Select also renders a hidden native
      // <select> whose options contain "+57".
      await expect(registerPage.countryCodeCombobox).toBeVisible();
      await expect(registerPage.countryCodeCombobox).toContainText("+57");
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

    test("password mismatch shows error and disables submit", async () => {
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

    test("step 2 renders business data fields", async () => {
      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({ timeout: 3_000 });
      // City is a cascading select: visible but disabled until a
      // department is chosen
      await expect(registerPage.cityCombobox).toBeVisible();
      await expect(registerPage.cityCombobox).toBeDisabled();
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

    test("mock: go back button returns to step 1", async () => {
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

      // next-intl appends a trailing slash before the query string
      await page.waitForURL(/\/es\/login\/?\?registered=true/, {
        timeout: 5_000,
      });
      await expect(page).toHaveURL(/\/es\/login\/?\?registered=true/);
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

    test("step 1 with malformed email does not advance (native validation)", async ({
      page,
    }) => {
      let registerCallCount = 0;
      await page.route(/\/auth\/register$/, (route) => {
        registerCallCount++;
        return route.continue();
      });

      await registerPage.goto();
      await registerPage.fillStep1({
        ...VALID_FORM_DATA,
        email: "not-an-email",
      });
      await registerPage.submitStep1();
      await page.waitForTimeout(400);

      // type="email" native validation blocks the submit — no advance, no API
      expect(registerCallCount).toBe(0);
      await expect(registerPage.nameInput).toBeVisible();
      await expect(registerPage.businessNameInput).not.toBeVisible();
    });

    test("empty step 2 submit does not call the backend", async ({ page }) => {
      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });

      let registerCallCount = 0;
      await page.route(/\/auth\/register$/, (route) => {
        registerCallCount++;
        return route.continue();
      });

      // Business name is required — native validation must block the submit
      await registerPage.submitStep2();
      await page.waitForTimeout(400);

      expect(registerCallCount).toBe(0);
      await expect(registerPage.businessNameInput).toBeVisible();
    });

    test("department enables city; changing department resets city", async ({
      page,
    }) => {
      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });

      // NOTE: the AutocompleteSelect triggers carry no accessible name
      // (plain <label>, no htmlFor), so they are located by their visible
      // placeholder/value text instead of by role name.
      const boxWithText = (text: string | RegExp) =>
        page.getByRole("combobox").filter({ hasText: text });

      // City is disabled until a department is chosen
      await expect(boxWithText(/^seleccioná un departamento$/i)).toBeEnabled();
      await expect(
        boxWithText(/^primero seleccioná un departamento$/i)
      ).toBeDisabled();

      // Pick Amazonas
      await boxWithText(/^seleccioná un departamento$/i).click();
      await page.getByRole("option", { name: "Amazonas" }).click();
      await expect(boxWithText("Amazonas")).toBeVisible();

      // City is now enabled — pick Leticia
      await expect(
        boxWithText(/^seleccioná una ciudad$/i)
      ).toBeEnabled();
      await boxWithText(/^seleccioná una ciudad$/i).click();
      await page.getByRole("option", { name: "Leticia" }).click();
      await expect(boxWithText("Leticia")).toBeVisible();

      // Changing department resets the city
      await boxWithText("Amazonas").click();
      await page.getByRole("option", { name: "Antioquia" }).click();
      await expect(boxWithText(/^seleccioná una ciudad$/i)).toBeVisible();
      await expect(boxWithText("Leticia")).toHaveCount(0);
    });

    test("industries load from the backend into the select", async ({
      page,
    }) => {
      await page.route(/\/industries$/, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "ind-restaurante",
              name: "Restaurante",
              slug: "restaurante",
              isActive: true,
            },
            {
              id: "ind-cafeteria",
              name: "Cafetería",
              slug: "cafeteria",
              isActive: true,
            },
          ]),
        })
      );

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });

      // The industry field is a native <select> (the only one on Step 2)
      const industrySelect = page.locator("select");
      await expect(
        industrySelect.getByRole("option", { name: "Restaurante" })
      ).toBeAttached({ timeout: 5_000 });
      await expect(
        industrySelect.getByRole("option", { name: "Cafetería" })
      ).toBeAttached();

      // Selecting an industry is optional but must stick when chosen
      await industrySelect.selectOption({ label: "Restaurante" });
      await expect(industrySelect).toHaveValue("ind-restaurante");
    });

    test("mock: server error (500) shows error toast, stays on step 2", async ({
      page,
    }) => {
      await mockRegisterError(page, 500, "Error interno del servidor");

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });
      // City is optional — business name alone is enough to submit
      await registerPage.fillStep2({
        businessName: VALID_BUSINESS_DATA.businessName,
      });
      await registerPage.submitStep2();

      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/error interno del servidor/i)
      ).toBeVisible({ timeout: 5_000 });

      // User stays on Step 2
      await expect(registerPage.businessNameInput).toBeVisible();
      await expect(registerPage.successHeading).not.toBeVisible();
    });

    test("mock: step 3 shows free-plan info", async ({ page }) => {
      await mockRegisterSuccess(page);

      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });
      // City is optional — business name alone is enough to submit
      await registerPage.fillStep2({
        businessName: VALID_BUSINESS_DATA.businessName,
      });
      await registerPage.submitStep2();

      await expect(registerPage.successHeading).toBeVisible({ timeout: 5_000 });
      await expect(
        page.getByText(/empezás con el plan gratuito/i)
      ).toBeVisible();
    });

    test("mock: expired wizard session resets to step 1", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const expiredState = {
          state: {
            currentStep: 2,
            businessId: null,
            // Older than the 24 h TTL
            createdAt: Date.now() - 25 * 60 * 60 * 1000,
          },
          version: 0,
        };
        sessionStorage.setItem(
          "togo-registration-wizard",
          JSON.stringify(expiredState)
        );
      });

      await registerPage.goto();

      // Wizard resets to Step 1.
      // NOTE: RegistrationWizard also intends to show a session-expired
      // warning toast here, but the mount effect runs against the
      // pre-hydration state so the toast never fires in practice —
      // reported as a product bug, not asserted.
      await expect(registerPage.nameInput).toBeVisible({ timeout: 5_000 });
      await expect(registerPage.businessNameInput).not.toBeVisible();
    });

    test("mock: authenticated user visiting register is sent to dashboard", async ({
      page,
    }) => {
      // beforeEach cleared cookies — simulate a browser that already
      // holds a valid refresh cookie.
      await mockAuthenticatedSession(page);
      await mockOrdersDashboard(page);

      await page.goto("/es/register");

      await page.waitForURL(/\/es\/dashboard\/orders/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/es\/dashboard\/orders/);
    });

    test("going back to step 1 clears step 1 data", async ({ page }) => {
      await registerPage.goto();
      await registerPage.fillStep1(VALID_FORM_DATA);
      await registerPage.submitStep1();

      await expect(registerPage.businessNameInput).toBeVisible({
        timeout: 3_000,
      });

      await registerPage.goBack();

      // Step 1 remounts fresh — passwords are never persisted
      await expect(registerPage.nameInput).toBeVisible({ timeout: 3_000 });
      await expect(registerPage.nameInput).toHaveValue("");
      await expect(registerPage.emailInput).toHaveValue("");
      await expect(page).toHaveURL(/\/es\/register/);
    });

    test("progress indicator shows all three steps", async ({ page }) => {
      await registerPage.goto();

      // Exact match — "Cuenta" is a substring of "Crear cuenta"
      await expect(page.getByText("Cuenta", { exact: true })).toBeVisible();
      await expect(page.getByText("Negocio", { exact: true })).toBeVisible();
      await expect(page.getByText("¡Listo!", { exact: true })).toBeVisible();

      // Step 1 is the active one
      await expect(page.getByText("Tus datos")).toBeVisible();
    });
  });
});
