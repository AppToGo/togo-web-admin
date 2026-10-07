import { type Page, type Locator } from "playwright/test";

/**
 * Page Object Model for the Forgot Password page.
 *
 * Locator strategy (in priority order):
 *   1. getByLabel  — tied to <label htmlFor>, accessible and stable
 *   2. getByRole   — semantic role, works with i18n text
 *   3. getByText   — visible text, last resort
 *
 * Never use CSS selectors or XPath — fragile and tied to implementation.
 */
export class ForgotPasswordPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToLoginLink: Locator;
  readonly successBackButton: Locator;
  readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tied to <label> "Correo electrónico" — stable across component refactors
    this.emailInput = page.getByLabel("Correo electrónico");

    // Role-based: survives text refactors as long as the button role is preserved
    this.submitButton = page.getByRole("button", {
      name: /enviar instrucciones/i,
    });

    // NOTE: the page renders the "Volver al inicio de sesión" link twice
    // with identical text — once inside the form card and once below it.
    // .first() targets the in-form link; both navigate to /login.
    this.backToLoginLink = page
      .getByRole("link", {
        name: /volver al inicio/i,
      })
      .first();

    // Success screen button (a Link wrapping a Button — has button role)
    this.successBackButton = page.getByRole("button", {
      name: /volver al inicio/i,
    });

    // Success screen heading ("¡Revisa tu correo!")
    this.successHeading = page.getByRole("heading", {
      name: /revisa tu correo/i,
    });
  }

  /**
   * Navigate to the forgot-password page and wait for the form to be hydrated.
   * Uses the default locale (es) unless overridden.
   */
  async goto(locale = "es"): Promise<void> {
    await this.page.goto(`/${locale}/forgot-password`);
    // Wait for React hydration — the email input becomes interactive
    await this.emailInput.waitFor({ state: "visible" });
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Returns the loading state button ("Enviando...") */
  getLoadingButton(): Locator {
    return this.page.getByRole("button", { name: /enviando/i });
  }

  /** Returns the success message paragraph that echoes the submitted email */
  getSuccessMessage(): Locator {
    return this.page.getByText(/hemos enviado instrucciones/i);
  }
}
