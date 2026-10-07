import { test, expect } from "playwright/test";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import {
  mockForgotPasswordSuccess,
  mockForgotPasswordError,
  mockForgotPasswordWithDelay,
} from "../helpers/mock-api";

/**
 * Forgot-password page E2E tests
 *
 * Mocked network only (no backend required):
 *   - Correct page rendering
 *   - HTML native validation (empty / malformed submit)
 *   - Successful request shows confirmation echoing the email
 *   - Back-to-login navigation (from form and from confirmation)
 *   - Loading state on submit + single request under double submit
 *   - Backend error (500) shows error toast, stays on form
 *   - Unknown email still shows success (no account enumeration)
 *   - Enter key submits the form
 */

test.describe("Forgot password page", () => {
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    // Start each test with a clean browser state
    await page.context().clearCookies();

    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    forgotPasswordPage = new ForgotPasswordPage(page);
  });

  test("renders all required elements", async ({ page }) => {
    await forgotPasswordPage.goto();

    // Page headings (page title + card title)
    await expect(
      page.getByRole("heading", { name: "Recuperar contraseña" })
    ).toBeVisible();
    await expect(
      page.getByText("¿Olvidaste tu contraseña?")
    ).toBeVisible();

    // Instructions
    await expect(
      page.getByText(/ingresa tu correo electrónico/i)
    ).toBeVisible();

    // Form fields — verified via accessible labels
    await expect(forgotPasswordPage.emailInput).toBeVisible();

    // Submit button — enabled by default
    await expect(forgotPasswordPage.submitButton).toBeVisible();
    await expect(forgotPasswordPage.submitButton).toBeEnabled();

    // Back-to-login link (rendered twice: in-form card and below it)
    await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
    await expect(
      page.getByRole("link", { name: /volver al inicio/i })
    ).toHaveCount(2);
  });

  test("empty submit does not call the backend (HTML native validation)", async ({
    page,
  }) => {
    let forgotCallCount = 0;
    await page.route(/\/auth\/forgot-password$/, (route) => {
      forgotCallCount++;
      return route.continue();
    });

    await forgotPasswordPage.goto();

    // Submit without filling the email
    await forgotPasswordPage.submit();

    // Browser native validation should prevent the fetch — wait briefly
    await page.waitForTimeout(400);

    expect(forgotCallCount).toBe(0);
    await expect(page).toHaveURL(/\/es\/forgot-password/);
  });

  test("malformed email does not call the backend", async ({ page }) => {
    let forgotCallCount = 0;
    await page.route(/\/auth\/forgot-password$/, (route) => {
      forgotCallCount++;
      return route.continue();
    });

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("not-an-email");

    // type="email" native validation must block the submit
    await forgotPasswordPage.submit();
    await page.waitForTimeout(400);

    expect(forgotCallCount).toBe(0);
    await expect(page).toHaveURL(/\/es\/forgot-password/);
  });

  test("mock: successful request shows confirmation echoing the email", async ({
    page,
  }) => {
    await mockForgotPasswordSuccess(page);

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("test@togo.com");
    await forgotPasswordPage.submit();

    // Success screen replaces the form
    await expect(forgotPasswordPage.successHeading).toBeVisible({
      timeout: 5_000,
    });
    await expect(forgotPasswordPage.getSuccessMessage()).toContainText(
      "test@togo.com"
    );

    // Form is gone
    await expect(forgotPasswordPage.emailInput).not.toBeVisible();
  });

  test("mock: back-to-login button from confirmation navigates to login", async ({
    page,
  }) => {
    await mockForgotPasswordSuccess(page);

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("test@togo.com");
    await forgotPasswordPage.submit();

    await expect(forgotPasswordPage.successHeading).toBeVisible({
      timeout: 5_000,
    });

    await forgotPasswordPage.successBackButton.click();

    await page.waitForURL(/\/es\/login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/\/es\/login/);
  });

  test("back-to-login link from the form navigates to login", async ({
    page,
  }) => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.backToLoginLink.click();

    await page.waitForURL(/\/es\/login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/\/es\/login/);
  });

  test("mock: button shows loading state during submit", async ({ page }) => {
    // Backend responds after 1.5 s so we can observe the loading state
    await mockForgotPasswordWithDelay(page, 1500);

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("test@togo.com");

    // Click submit — do NOT await full resolution
    await forgotPasswordPage.submit();

    // Button must be in loading state immediately after click
    await expect(forgotPasswordPage.getLoadingButton()).toBeVisible({
      timeout: 2_000,
    });
    await expect(forgotPasswordPage.getLoadingButton()).toBeDisabled();
  });

  test("mock: resubmit while loading sends exactly one request", async ({
    page,
  }) => {
    let forgotCallCount = 0;
    await page.route(/\/auth\/forgot-password$/, async (route) => {
      forgotCallCount++;
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Reset email queued" }),
      });
    });

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("test@togo.com");
    await forgotPasswordPage.submit();

    // While pending the submit button is replaced by a disabled loading one
    await expect(forgotPasswordPage.getLoadingButton()).toBeDisabled({
      timeout: 2_000,
    });

    // A second click attempt on the disabled loading button must not
    // issue another request (Playwright click times out on disabled
    // elements — swallow it, the assertion below is what matters).
    await forgotPasswordPage
      .getLoadingButton()
      .click({ timeout: 1_000 })
      .catch(() => {});

    // Let the delayed call resolve, then verify a single request
    await page.waitForTimeout(2_000);
    expect(forgotCallCount).toBe(1);
  });

  test("mock: backend error (500) shows error toast and stays on form", async ({
    page,
  }) => {
    await mockForgotPasswordError(page, 500, "Error al enviar el correo");

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("test@togo.com");
    await forgotPasswordPage.submit();

    // useForgotPassword.onError → toast.error with the backend message
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(/error al enviar el correo/i)
    ).toBeVisible({ timeout: 5_000 });

    // No success screen — the form is still there
    await expect(forgotPasswordPage.successHeading).not.toBeVisible();
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(page).toHaveURL(/\/es\/forgot-password/);
  });

  test("mock: unknown email still shows success (no account enumeration)", async ({
    page,
  }) => {
    // The backend always responds 200 even when the email is not
    // registered — the UI must not reveal whether the account exists.
    await mockForgotPasswordSuccess(page);

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("nobody-knows@example.com");
    await forgotPasswordPage.submit();

    await expect(forgotPasswordPage.successHeading).toBeVisible({
      timeout: 5_000,
    });
    await expect(forgotPasswordPage.getSuccessMessage()).toContainText(
      "nobody-knows@example.com"
    );
  });

  test("mock: Enter key submits the form", async ({ page }) => {
    await mockForgotPasswordSuccess(page);

    await forgotPasswordPage.goto();
    await forgotPasswordPage.fillEmail("test@togo.com");
    await forgotPasswordPage.emailInput.press("Enter");

    await expect(forgotPasswordPage.successHeading).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).toHaveURL(/\/es\/forgot-password/);
  });
});
