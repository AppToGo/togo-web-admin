import { type Page } from "playwright/test";

/**
 * Network mocking helpers for the orders dashboard (E2E).
 *
 * `mockOrdersDashboard()` intercepts every `/v1/**` call with a single
 * dispatcher (routed by pathname), instead of one `page.route()` per
 * endpoint — the orders Kanban fans out to `/branches`,
 * `/businesses/:id/orders` (live), `/businesses/:id/orders?status=COMPLETED`
 * (infinite scroll) and `/businesses/:id/orders/metrics` on a single mount,
 * and registering them separately makes route-precedence (Playwright runs
 * the LAST-registered matching route first) easy to get wrong. Unmatched
 * paths call `route.fallback()`, deferring to whatever was registered
 * before this (ex. `mockLoginSuccess()`'s `**\/v1/auth/login` handler —
 * call that FIRST, then this).
 */

const BUSINESS_ID = "e2e-test-business-id";
const BRANCH_ID = "e2e-test-branch-id";

const FAKE_BRANCH = {
  id: BRANCH_ID,
  businessId: BUSINESS_ID,
  name: "Sede Centro",
  slug: "sede-centro",
  code: "CC-001",
  isMainBranch: true,
  isActive: true,
  address: "Calle 123",
  timezone: "America/Bogota",
  currency: "COP",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * `useEffectiveBranches()` para un usuario no-SUPER_ADMIN NO llama a
 * `/branches` — llama a `GET /auth/session` (`useUserBranches()` →
 * `getUserSession()`), que es lo que puebla el branch store vía
 * `useSingleBranchInit()`. Sin este mock, la página cae en el estado
 * "No hay sucursales seleccionadas" aunque el resto de las respuestas
 * esté bien formado.
 */
const FAKE_SESSION = {
  defaultBranchId: BRANCH_ID,
  branches: [{ id: BRANCH_ID, name: FAKE_BRANCH.name, isMainBranch: true, role: "OWNER" }],
  business: { id: BUSINESS_ID, name: "Test Business", plan: "PRO", maxBranches: 5 },
  userPreferences: { defaultBranchId: BRANCH_ID },
};

function baseOrder(overrides: Record<string, unknown>) {
  const now = new Date().toISOString();
  return {
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    subtotal: 20000,
    tax: 0,
    total: 20000,
    totalAmount: 20000,
    customerId: "cust-e2e",
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    createdAt: now,
    updatedAt: now,
    customer: { id: "cust-e2e", name: "Cliente E2E", phoneNumber: "+573000000000" },
    items: [{ id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 }],
    ...overrides,
  };
}

/** Pedido a domicilio — sin relación con las modalidades bajo prueba, sirve de control. */
const DELIVERY_ORDER = baseOrder({
  id: "delivery1",
  deliveryType: "DELIVERY",
  addressId: "addr-e2e",
  address: { id: "addr-e2e", label: "Casa", addressText: "Cra 1 # 2-3" },
});

/** Pedido para recoger en tienda — sin mesa, sin dirección. */
const PICKUP_ORDER = baseOrder({
  id: "pickup01",
  deliveryType: "PICKUP",
});

/**
 * Pedido en mesa (docs/architecture/pedidos-en-mesa.md). Antes del fix del
 * filtro (Fase 1), `OrdersKanbanBoard` clasificaba cualquier pedido sin
 * `addressId` como "pickup" — un DINE_IN caía en el mismo balde que
 * PICKUP_ORDER y el filtro "Recoger en tienda" lo ocultaba/mostraba junto
 * con él, sin poder aislarlos.
 */
const DINE_IN_ORDER = baseOrder({
  id: "dinein01",
  deliveryType: "DINE_IN",
  tableId: "table-e2e",
  tableLabel: "Mesa 3",
});

const EMPTY_METRICS = {
  businessId: BUSINESS_ID,
  generadoEn: new Date().toISOString(),
  periodo: {},
  conteos: { total: 0, pagadas: 0, pendientesPago: 0, hoy: 0, completadasHoy: 0 },
  porEstadoOrden: {},
  porTipoEntrega: {
    DELIVERY: { total: 0, pagadas: 0, pendientesPago: 0 },
    PICKUP: { total: 0, pagadas: 0, pendientesPago: 0 },
    DINE_IN: { total: 0, pagadas: 0, pendientesPago: 0 },
  },
  recaudos: {
    pagadas: { subtotal: 0, delivery: 0, total: 0 },
    pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    delivery: {
      pagadas: { subtotal: 0, delivery: 0, total: 0 },
      pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    },
    pickup: {
      pagadas: { subtotal: 0, delivery: 0, total: 0 },
      pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    },
    dineIn: {
      pagadas: { subtotal: 0, delivery: 0, total: 0 },
      pendientesPago: { subtotal: 0, delivery: 0, total: 0 },
    },
  },
  promedios: { valorOrden: 0, valorOrdenPagada: 0, valorOrdenDelivery: 0, valorOrdenPickup: 0 },
  comparativa: {
    recaudoTotal: { valor: 0, valorAnterior: 0, crecimiento: 0 },
    ordenesTotales: { valor: 0, valorAnterior: 0, crecimiento: 0 },
  },
  metodosPago: [],
  horasPico: [],
  tasasConversion: { confirmacion: 0, pago: 0, completitud: 0, cancelacion: 0, abandono: 0 },
};

/**
 * Mockea todo lo que la página `/dashboard/orders` necesita para renderizar
 * el Kanban con 3 pedidos LIVE en CONFIRMED (uno por modalidad) y ninguna
 * orden completada. Llamar DESPUÉS de `mockLoginSuccess(page)`.
 */
export async function mockOrdersDashboard(page: Page): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith("/branches")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([FAKE_BRANCH]),
      });
    }

    if (path.endsWith("/auth/session")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_SESSION),
      });
    }

    if (path.endsWith("/orders/metrics")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(EMPTY_METRICS),
      });
    }

    if (path.endsWith("/orders")) {
      if (url.searchParams.get("status") === "COMPLETED") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ orders: [], total: 0, page: 1, totalPages: 0, hasMore: false }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([DELIVERY_ORDER, PICKUP_ORDER, DINE_IN_ORDER]),
      });
    }

    await route.fallback();
  });
}
