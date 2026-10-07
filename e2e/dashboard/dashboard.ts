import { expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";

export interface DashboardBranch {
  id: string;
  name: string;
  isMainBranch?: boolean;
}

export const DEFAULT_BRANCHES: DashboardBranch[] = [
  { id: "branch-centro", name: "Sede Centro", isMainBranch: true },
  { id: "branch-norte", name: "Sede Norte" },
];

/**
 * Combined KPI + detailed metrics payload, in the exact backend shape both
 * transformers (`useKpiMetrics`, `useDetailedMetrics`) consume from
 * GET /businesses/:businessId/orders/metrics.
 */
export function defaultMetricsBody() {
  return {
    conteos: {
      hoy: 12,
      completadasHoy: 8,
      total: 340,
      pagadas: 300,
      pendientesPago: 40,
    },
    recaudos: {
      pagadas: { total: 1250000 },
      porDia: [
        { date: "2026-10-01", amount: 400000 },
        { date: "2026-10-02", amount: 850000 },
      ],
    },
    comparativa: {
      recaudoTotal: { valor: 1250000, valorAnterior: 1000000, crecimiento: 25 },
      ordenesTotales: { crecimiento: 8.5 },
    },
    metodosPago: [
      { metodo: "CASH", cantidad: 7, monto: 700000, porcentaje: 56 },
      { metodo: "CARD", cantidad: 5, monto: 550000, porcentaje: 44 },
    ],
    tasasConversion: {
      conteos: { confirmado: 20, pagado: 15, completado: 12 },
      pago: 75,
      completitud: 80,
    },
    horasPico: [
      { hora: 12, cantidad: 9 },
      { hora: 19, cantidad: 14 },
    ],
  };
}

export interface MetricsRequest {
  dateFrom: string | null;
  dateTo: string | null;
  branchIds: string | null;
}

/**
 * Mock GET /businesses/:businessId/orders/metrics (serves KPI cards,
 * metrics grid and charts). Register AFTER the generic **\/v1/** mocks —
 * last matching route wins. Every hit is recorded for filter assertions.
 */
export async function mockDashboardMetrics(
  page: Page,
  opts: {
    body?: ReturnType<typeof defaultMetricsBody>;
    status?: number;
    onRequest?: (req: MetricsRequest) => void;
  } = {}
): Promise<void> {
  await page.route("**/orders/metrics*", async (route) => {
    const url = new URL(route.request().url());
    opts.onRequest?.({
      dateFrom: url.searchParams.get("dateFrom"),
      dateTo: url.searchParams.get("dateTo"),
      branchIds: url.searchParams.get("branchIds"),
    });
    if (opts.status && opts.status !== 200) {
      return route.fulfill({
        status: opts.status,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error interno" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts.body ?? defaultMetricsBody()),
    });
  });
}

/**
 * Mock GET /auth/session (BranchSelector for non-SUPER_ADMIN users:
 * `useEffectiveBranches` → `useUserBranches` → `getUserSession`).
 * Two branches by default so the selector renders instead of returning
 * null (`showBranchSelector` needs > 1).
 */
export async function mockBranches(
  page: Page,
  opts: { branches?: DashboardBranch[]; status?: number } = {}
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/auth/session")) {
      if (opts.status && opts.status !== 200) {
        return route.fulfill({
          status: opts.status,
          contentType: "application/json",
          body: JSON.stringify({ message: "Error interno" }),
        });
      }
      const branches = (opts.branches ?? DEFAULT_BRANCHES).map((b) => ({
        id: b.id,
        name: b.name,
        isMainBranch: b.isMainBranch ?? false,
        role: "OWNER",
      }));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          defaultBranchId: branches[0]?.id ?? null,
          branches,
          business: {
            id: "e2e-test-business-id",
            name: "Test Business",
            plan: "PRO",
            maxBranches: 5,
          },
          userPreferences: { defaultBranchId: branches[0]?.id ?? null },
        }),
      });
    }
    await route.fallback();
  });
}

/**
 * Shared setup for dashboard specs: logs in with the mocked backend and
 * lands on a hydrated dashboard, discarding the overlays that would
 * otherwise intercept clicks (onboarding tour, welcome toast, upsell).
 *
 * NOTE: login lands on /dashboard/orders, which needs the orders mocks to
 * render — without them the Kanban crashes reading its (failed) queries.
 * Dashboard specs navigate straight to /dashboard instead of depending on
 * another screen's mocks.
 *
 * Requires `mockLoginSuccess(page)` + scenario routes to be registered
 * BEFORE calling (Playwright runs the LAST-registered matching route
 * first, so register the generic blockers first — see orders/board.ts).
 */
export async function openDashboard(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();
  await page.goto("/es/dashboard");

  // Sync point: the greeting means the dashboard hydrated.
  await expect(
    page.getByRole("heading", { name: "¡Hola, Test User!" })
  ).toBeVisible();

  // Full-screen onboarding spotlight — dismiss when present.
  await page
    .getByRole("button", { name: /saltar tour/i })
    .click({ timeout: 5_000 })
    .catch(() => undefined);
  // Welcome toast floats over the header controls and steals clicks.
  await page
    .getByText("¡Bienvenido! Inicio de sesión exitoso")
    .waitFor({ state: "hidden", timeout: 15_000 })
    .catch(() => undefined);
  // Plan upsell modal (unmocked /plans falls into its error state).
  await page
    .getByText("Continuar con plan gratuito")
    .click({ timeout: 5_000 })
    .catch(() => undefined);
}
