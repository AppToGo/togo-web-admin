import { test, expect, type Page, type Request } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockConversationFunnel } from "../helpers/mock-conversation-funnel-api";

/**
 * Embudo del bot (plan bot natural, T20) en el admin: entrada del menú
 * según el permiso `metrics.view`, y la vista con los números del
 * endpoint `metrics/conversation-funnel` mockeado.
 */
test.describe("Embudo del bot", () => {
  async function login(
    page: Page,
    permissions: string[],
    onFunnelRequest?: (r: Request) => void,
    userOverrides: Record<string, unknown> = {}
  ) {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockLoginSuccess(page, userOverrides);
    await mockOrdersDashboard(page);
    await mockConversationFunnel(page, { permissions, onFunnelRequest });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
    await loginPage.waitForDashboardRedirect();
    // Tour de onboarding y toast de bienvenida del dashboard de pedidos.
    await page
      .getByRole("button", { name: /saltar tour/i })
      .click({ timeout: 5_000 })
      .catch(() => undefined);
    // Modal de planes: sin mock de /subscription queda abierto encima del menú.
    await page
      .getByRole("button", { name: /continuar con plan gratuito/i })
      .click({ timeout: 5_000 })
      .catch(() => undefined);
  }

  test("muestra el embudo del negocio desde el menú", async ({ page }) => {
    const funnelRequests: URL[] = [];
    await login(page, ["metrics.view"], (request) =>
      funnelRequests.push(new URL(request.url()))
    );

    await page.getByRole("link", { name: "Embudo del bot" }).click();
    await page.waitForURL(/\/es\/dashboard\/conversation-funnel/);

    await expect(
      page.getByRole("heading", { name: "Embudo del bot" })
    ).toBeVisible();

    // KPIs de sesiones.
    await expect(
      page.getByText("Terminan en pedido", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("2 de 6 cerradas").first()).toBeVisible();
    await expect(page.getByText("1 de 7 conversaciones")).toBeVisible();

    // Dónde se abandonan y cómo terminan, con los nombres de los pasos.
    await expect(
      page.getByText("Dónde se abandonan", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Eligiendo cómo pagar").first()).toBeVisible();
    await expect(page.getByText("Cerrada sin resultado")).toBeVisible();

    // Qué tan bien entiende el bot: tasas y tabla por paso.
    await expect(page.getByText("No entendidos").first()).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Buscando productos" })
    ).toBeVisible();
    await expect(
      page.getByText("Días según la zona horaria del negocio (America/Bogota).")
    ).toBeVisible();

    // T21: reescrituras con IA.
    await expect(page.getByText("Reescrituras con IA")).toBeVisible();
    await expect(page.getByText("Cambió un nombre u opción")).toBeVisible();
    await expect(page.getByText("Tardó demasiado")).toBeVisible();

    // El período del filtro viaja como días (YYYY-MM-DD).
    expect(funnelRequests.length).toBeGreaterThan(0);
    const last = funnelRequests[funnelRequests.length - 1];
    expect(last.searchParams.get("dateFrom")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(last.searchParams.get("dateTo")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("sin metrics.view no aparece en el menú", async ({ page }) => {
    await login(page, ["order.view"]);

    await expect(
      page.getByRole("link", { name: "Pedidos" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Embudo del bot" })
    ).toHaveCount(0);
  });

  test("un SUPER_ADMIN sin negocio elegido ve el aviso para elegir uno", async ({
    page,
  }) => {
    const funnelRequests: Request[] = [];
    await login(
      page,
      ["metrics.view"],
      (request) => funnelRequests.push(request),
      { role: "SUPER_ADMIN", businessId: null, businessName: null }
    );

    await page.getByRole("link", { name: "Embudo del bot" }).click();
    await page.waitForURL(/\/es\/dashboard\/conversation-funnel/);

    await expect(
      page.getByRole("heading", { name: "Selecciona un negocio" })
    ).toBeVisible();
    await expect(page.getByText("No se pudo cargar el embudo")).toHaveCount(0);
    expect(funnelRequests).toHaveLength(0);
  });
});
