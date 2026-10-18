import { test, expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockBusinessSettings } from "../helpers/mock-bot-voice-api";
import { mockRefreshSuccess } from "../orders/board";

/**
 * Configuración → Sedes (listado en tarjetas y detalle con índice fijo) y
 * Datos del negocio (vista previa del catálogo en vivo), en escritorio.
 */

test.use({ viewport: { width: 1440, height: 900 } });

const now = new Date().toISOString();

function branch(overrides: Record<string, unknown>) {
  return {
    businessId: "e2e-test-business-id",
    slug: "sede",
    isMainBranch: false,
    isActive: true,
    address: "Cra. 49 # 52-30, Medellín",
    timezone: "America/Bogota",
    currency: "COP",
    createdAt: now,
    updatedAt: now,
    businessHours: {},
    acceptingOrdersStatus: { aceptando: true, motivo: "SIN_CONFIGURAR" },
    deliveryConfig: { type: "FREE" },
    ...overrides,
  };
}

const BRANCHES = [
  branch({ id: "b-1", name: "Sede Centro", code: "SC-001", slug: "sede-centro", isMainBranch: true }),
  branch({ id: "b-2", name: "Sede Bello", code: "SB-002", slug: "sede-bello", isActive: false }),
];

async function mockBranchesApi(page: Page): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/branches/can-create")) {
      return json({ allowed: true, current: 2, max: 5, remaining: 3 });
    }
    const metrics = path.match(/\/branches\/([^/]+)\/metrics$/);
    if (metrics) return json({ ordersToday: 12, pendingOrders: 3, revenueToday: 480000 });
    const one = path.match(/\/branches\/([^/]+)$/);
    if (one && route.request().method() === "GET") {
      const found = BRANCHES.find((b) => b.id === one[1]);
      if (found) return json(found);
    }
    if (path.endsWith("/branches")) return json(BRANCHES);
    if (path.endsWith("/whatsapp-accounts") || path.endsWith("/whatsapp-routing")) return json([]);
    if (path.includes("/tables")) return json([]);
    return route.fallback();
  });
}

async function login(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await mockLoginSuccess(page);
  await mockOrdersDashboard(page);
  await mockRefreshSuccess(page);
  await mockBusinessSettings(page, { paraphraseAvailable: false });
  await mockBranchesApi(page);

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
}

test("sedes: tarjetas con un solo estado y filtros", async ({ page }) => {
  await login(page);
  await page.goto("/es/dashboard/branches");

  const grid = page.getByTestId("branches-grid");
  await expect(grid.getByRole("listitem")).toHaveCount(2);
  const centro = grid.getByRole("listitem").filter({ hasText: "Sede Centro" });
  await expect(centro.getByText("Sin horario")).toBeVisible();
  await expect(centro.getByText("Principal")).toBeVisible();
  await expect(centro.getByText("$ 480.000")).toBeVisible();
  await expect(
    grid.getByRole("listitem").filter({ hasText: "Sede Bello" }).getByText("Inactiva")
  ).toBeVisible();

  await page.getByRole("button", { name: /Inactivas/ }).click();
  await expect(grid.getByRole("listitem")).toHaveCount(1);
  await expect(grid.getByText("Sede Bello")).toBeVisible();

  // Hacer principal y eliminar viven en el menú ⋯.
  await grid.getByRole("button", { name: "Más acciones de Sede Bello" }).click();
  await expect(page.getByRole("menuitem", { name: "Hacer sede principal" })).toBeVisible();
});

test("detalle de sede: índice fijo que marca la sección y barra de guardar", async ({ page }) => {
  await login(page);
  await page.goto("/es/dashboard/branches/b-1");

  const nav = page.getByRole("navigation", { name: "Secciones de la sede" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "General" })).toHaveAttribute("aria-current", "location");

  await nav.getByRole("link", { name: "Pagos por transferencia" }).click();
  await expect(nav.getByRole("link", { name: "Pagos por transferencia" })).toHaveAttribute(
    "aria-current",
    "location"
  );
  // Sigue visible después del scroll.
  await expect(nav).toBeInViewport();

  await expect(page.getByText("Todo está guardado")).toBeVisible();
  await page.getByLabel("Nombre").first().fill("Sede Centro Norte");
  await expect(page.getByText("Tienes cambios sin guardar")).toBeVisible();
  await page.getByRole("button", { name: "Descartar" }).click();
  await expect(page.getByLabel("Nombre").first()).toHaveValue("Sede Centro");
});

test("datos del negocio: la vista previa cambia mientras se edita", async ({ page }) => {
  await login(page);
  await page.goto("/es/dashboard/settings/general/business");

  const preview = page.getByRole("img", { name: /Vista previa del catálogo de/ });
  await expect(preview).toHaveAccessibleName("Vista previa del catálogo de Test Business");

  await page.getByLabel("Nombre del negocio").fill("Burger House");
  await expect(preview).toHaveAccessibleName("Vista previa del catálogo de Burger House");
  await expect(preview.getByText("BH")).toBeVisible();
  await expect(page.getByText("Sin guardar", { exact: true })).toBeVisible();
  await expect(page.getByText("Tienes cambios sin guardar")).toBeVisible();

  await page.getByRole("button", { name: "Descartar" }).click();
  await expect(preview).toHaveAccessibleName("Vista previa del catálogo de Test Business");
  await expect(page.getByText("Tienes cambios sin guardar")).toHaveCount(0);
});
