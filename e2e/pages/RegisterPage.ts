import { type Page, type Locator } from "playwright/test";

/**
 * Page Object Model for the Registration Wizard page.
 *
 * The PLG wizard is a 3-step flow:
 *   Step 1 — User data (name, email, phone, password, confirmPassword)
 *   Step 2 — Business data (businessName, industry, address, city) + registration API call
 *   Step 3 — PLG success confirmation
 *
 * Locator strategy (in priority order):
 *   1. getByLabel  — tied to <label htmlFor>, accessible and stable
 *   2. getByRole   — semantic role, works with i18n text
 *   3. getByText   — visible text, last resort
 *
 * Never use CSS selectors or XPath — fragile and tied to implementation.
 */
export class RegisterPage {
  readonly page: Page;

  // ── Step 1 — inputs ────────────────────────────────────────────────────────

  /** "Nombre completo" label */
  readonly nameInput: Locator;
  /** "Correo electrónico" label */
  readonly emailInput: Locator;
  /** "Teléfono de contacto" label */
  readonly phoneInput: Locator;
  /** "Contraseña" label — exact match to avoid also matching "Confirmar contraseña" */
  readonly passwordInput: Locator;
  /** "Confirmar contraseña" label */
  readonly confirmPasswordInput: Locator;
  /**
   * "Continuar" button (Step 1 submit).
   * Uses /^continuar$/i so it does NOT match Step 2 "Crear cuenta".
   */
  readonly continueStep1Button: Locator;

  // ── Step 2 — inputs ────────────────────────────────────────────────────────

  /** "Nombre del negocio" label — now in Step 2 */
  readonly businessNameInput: Locator;
  /** "Ciudad" label — new in Step 2 */
  readonly cityInput: Locator;
  /** "Dirección del local" label — new in Step 2 */
  readonly addressInput: Locator;
  /** "Crear cuenta" button (Step 2 submit) */
  readonly createAccountButton: Locator;
  /** "← Volver" button */
  readonly goBackButton: Locator;

  // ── Step 3 ─────────────────────────────────────────────────────────────────

  /** "¡Cuenta creada exitosamente!" heading */
  readonly successHeading: Locator;
  /** "Ir al inicio de sesión" button */
  readonly goToLoginButton: Locator;

  // ── Navigation ─────────────────────────────────────────────────────────────

  /** "Inicia sesión" link at the bottom of the page */
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1 inputs — tied to <label> text, stable across refactors
    this.nameInput = page.getByLabel("Nombre completo");
    this.emailInput = page.getByLabel("Correo electrónico");
    this.phoneInput = page.getByLabel("Teléfono de contacto");
    // exact: true prevents matching "Confirmar contraseña"
    this.passwordInput = page.getByLabel("Contraseña", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Confirmar contraseña");

    // Step 1 submit button
    this.continueStep1Button = page.getByRole("button", {
      name: /^continuar$/i,
    });

    // Step 2 inputs
    this.businessNameInput = page.getByLabel("Nombre del negocio");
    this.cityInput = page.getByLabel("Ciudad");
    this.addressInput = page.getByLabel("Dirección del local");

    // Step 2 buttons
    this.createAccountButton = page.getByRole("button", {
      name: /crear cuenta/i,
    });
    this.goBackButton = page.getByRole("button", { name: /volver/i });

    // Step 3 elements
    this.successHeading = page.getByText(/cuenta creada exitosamente/i);
    this.goToLoginButton = page.getByRole("button", { name: /ir al inicio/i });

    // Bottom navigation link
    this.loginLink = page.getByRole("link", { name: /inicia sesión/i });
  }

  // ── Navigation methods ─────────────────────────────────────────────────────

  /**
   * Navigate to the registration page and wait for Step 1 to be hydrated.
   *
   * @param locale - Next-intl locale prefix (default: "es")
   */
  async goto(locale = "es"): Promise<void> {
    await this.page.goto(`/${locale}/register`);
    await this.nameInput.waitFor({ state: "visible" });
  }

  // ── Step 1 methods ─────────────────────────────────────────────────────────

  /**
   * Fill all Step 1 form fields.
   *
   * @param data.phone - Local digits only (no +57 prefix — the UI adds it)
   */
  async fillStep1(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  /** Click the Step 1 "Continuar" submit button. */
  async submitStep1(): Promise<void> {
    await this.continueStep1Button.click();
  }

  // ── Step 2 methods ─────────────────────────────────────────────────────────

  /**
   * Fill Step 2 business data fields.
   */
  async fillStep2(data: {
    businessName: string;
    city?: string;
    address?: string;
  }): Promise<void> {
    await this.businessNameInput.fill(data.businessName);
    if (data.city) await this.cityInput.fill(data.city);
    if (data.address) await this.addressInput.fill(data.address);
  }

  /** Click the Step 2 "Crear cuenta" button to submit business data + register. */
  async submitStep2(): Promise<void> {
    await this.createAccountButton.click();
  }

  /** Click the Step 2 "← Volver" button to return to Step 1. */
  async goBack(): Promise<void> {
    await this.goBackButton.click();
  }

  // ── Step 3 methods ─────────────────────────────────────────────────────────

  /** Click the Step 3 "Ir al inicio de sesión" button. */
  async goToLogin(): Promise<void> {
    await this.goToLoginButton.click();
  }

  // ── Error helpers ──────────────────────────────────────────────────────────

  /**
   * Returns the error <p> element rendered by the Input component for the
   * field identified by its label text.
   *
   * The Input component renders errors inside the same div.w-full wrapper
   * that contains the <label>. This locator finds that wrapper first, then
   * looks for the error paragraph inside it.
   *
   * Compatible with both "!text-red-500" (important modifier) and "text-red-500".
   *
   * @param labelText - The label text of the field (e.g. "Confirmar contraseña")
   */
  getFieldError(labelText: string): Locator {
    return this.page
      .locator("div.w-full")
      .filter({ has: this.page.locator("label", { hasText: labelText }) })
      .locator("p.\\!text-red-500, p.text-red-500");
  }

  /**
   * Returns the Step 2 submit button while it is in the loading state.
   * The button shows an animated spinner (.animate-spin) during the API call.
   */
  getStep2LoadingButton(): Locator {
    return this.page
      .getByRole("button")
      .filter({ has: this.page.locator(".animate-spin") });
  }
}
