import { type Page, type Locator } from "playwright/test";

/**
 * Page Object Model for the Login page.
 *
 * Locator strategy (in priority order):
 *   1. getByLabel  — tied to <label htmlFor>, accessible and stable
 *   2. getByRole   — semantic role, works with i18n text
 *   3. getByText   — visible text, last resort
 *
 * Never use CSS selectors or XPath — fragile and tied to implementation.
 */
export class LoginPage {
  readonly page: Page;

  // Form fields
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Navigation links
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  // Language switcher trigger (Globe button in the LanguageSwitcher component)
  readonly languageSwitcherTrigger: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tied to <label> "Correo electrónico" — stable across component refactors
    this.emailInput = page.getByLabel("Correo electrónico");
    this.passwordInput = page.getByLabel("Contraseña");

    // Role-based: survives text refactors as long as the button role is preserved
    this.submitButton = page.getByRole("button", { name: /iniciar sesión/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /olvidaste/i });

    // Link "¿No tienes una cuenta? Regístrate aquí" at the bottom of the page
    this.registerLink = page.getByRole("link", { name: /regístrate/i });

    // LanguageSwitcher: a ghost button that opens a Radix UI dropdown.
    // Identified by the Globe icon aria-label fallback or by its visible text.
    this.languageSwitcherTrigger = page.getByRole("button", { name: /español|english/i });
  }

  /**
   * Navigate to the login page and wait for the form to be hydrated.
   * Uses the default locale (es) unless overridden.
   */
  async goto(locale = "es"): Promise<void> {
    await this.page.goto(`/${locale}/login`);
    // Wait for React hydration — the email input becomes interactive
    await this.emailInput.waitFor({ state: "visible" });
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Returns the error paragraph rendered by the Input component
   * when login.error is set.
   *
   * The Input component renders: <p class="text-red-500">{error}</p>
   * as a sibling of the <input> that has aria-invalid="true".
   */
  getEmailError(): Locator {
    return this.page.locator('input[aria-invalid="true"] ~ p').first();
  }

  /** Returns the loading state button ("Iniciando sesión...") */
  getLoadingButton(): Locator {
    return this.page.getByRole("button", { name: /iniciando sesión/i });
  }

  /**
   * Returns a menu item inside the Radix UI DropdownMenuContent.
   * The dropdown must be open before calling this.
   *
   * @param localeName - Partial name to match, e.g. "English" or "Español"
   */
  getLanguageOption(localeName: string): Locator {
    return this.page.getByRole("menuitem", { name: new RegExp(localeName, "i") });
  }

  async waitForDashboardRedirect(): Promise<void> {
    await this.page.waitForURL(/\/es\/dashboard\/orders/, { timeout: 10_000 });
  }
}
