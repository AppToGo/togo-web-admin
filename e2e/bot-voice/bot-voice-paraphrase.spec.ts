import { test, expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockBusinessSettings } from "../helpers/mock-bot-voice-api";

/**
 * Plan bot natural, T21: interruptor "Reescribir avisos con IA" en la voz
 * del asistente (Configuración → Datos del negocio).
 */
test.describe("Voz del asistente — paráfrasis", () => {
  async function openBusinessSettings(
    page: Page,
    options: Parameters<typeof mockBusinessSettings>[1]
  ) {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockBusinessSettings(page, options);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
    await loginPage.waitForDashboardRedirect();
    await page
      .getByRole("button", { name: /saltar tour/i })
      .click({ timeout: 5_000 })
      .catch(() => undefined);
    await page
      .getByRole("button", { name: /continuar con plan gratuito/i })
      .click({ timeout: 5_000 })
      .catch(() => undefined);

    await page.getByRole("button", { name: "Configuración" }).first().click();
    await page.getByRole("link", { name: "Datos del Negocio" }).click();
    await page.waitForURL(/\/es\/dashboard\/settings\/general\/business/);
  }

  test("prende la paráfrasis y la guarda con la voz", async ({ page }) => {
    const updates: Record<string, unknown>[] = [];
    await openBusinessSettings(page, {
      paraphraseAvailable: true,
      onUpdate: (body) => updates.push(body),
    });

    const toggle = page.getByRole("switch", {
      name: "Reescribir avisos con IA (beta)",
    });
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();
    await expect(
      page.getByText("Todavía no está habilitado en ToGo", { exact: false })
    ).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toBeChecked();

    // El botón Guardar de la tarjeta de voz (el formulario tiene otro).
    const voiceCard = page.locator("div", {
      has: page.getByText("Voz del asistente", { exact: true }),
    });
    await voiceCard.getByRole("button", { name: "Guardar" }).last().click();

    await expect.poll(() => updates.length).toBeGreaterThan(0);
    expect(updates.at(-1)).toMatchObject({
      botVoice: { address: "tu", emojis: true, paraphrase: true },
    });
  });

  test("sin habilitar en el servidor, avisa y no deja prenderla", async ({
    page,
  }) => {
    await openBusinessSettings(page, { paraphraseAvailable: false });

    const toggle = page.getByRole("switch", {
      name: "Reescribir avisos con IA (beta)",
    });
    await expect(
      page.getByText("Todavía no está habilitado en ToGo", { exact: false })
    ).toBeVisible();
    await expect(toggle).toBeDisabled();
  });

  test("si ya estaba prendida sin habilitar, se puede apagar", async ({
    page,
  }) => {
    await openBusinessSettings(page, {
      paraphraseAvailable: false,
      botVoice: { paraphrase: true },
    });

    const toggle = page.getByRole("switch", {
      name: "Reescribir avisos con IA (beta)",
    });
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
  });
});
