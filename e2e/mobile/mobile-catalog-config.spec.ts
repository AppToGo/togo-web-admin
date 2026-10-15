import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import { mockBranches } from "../dashboard/dashboard";
import {
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
  mockBoardPermissions,
  openBoard,
} from "../orders/board";

/**
 * Catálogo y Configuración en el teléfono (diseño "Caja POS móvil"): menú
 * aplanado, Productos · Inventario · Categorías con barra inferior, la lista
 * de Configuración y sus subpantallas con volver en la barra superior.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const PERMISSIONS = [
  "order.view",
  "order.create",
  "conversation.view",
  "metrics.view",
  "billing.view",
];

const now = new Date().toISOString();

function product(id: string, name: string, price: number, isActive = true) {
  return {
    id,
    businessId: "e2e-test-business-id",
    name,
    slug: id,
    kind: "SIMPLE",
    businessCategoryId: "cat-burgers",
    isActive,
    isFeatured: false,
    searchKeywords: [],
    variantCount: 1,
    priceFrom: price,
    priceTo: price,
    createdAt: now,
    updatedAt: now,
  };
}

function inventoryItem(id: string, name: string, stock: number | null, isAvailable = true) {
  return {
    id,
    businessId: "e2e-test-business-id",
    branchId: "branch-1",
    productVariantId: `var-${id}`,
    productName: name,
    productSlug: id,
    variantLabel: "Unidad",
    basePrice: 18000,
    stock,
    isAvailable,
    isActivated: true,
    priceOverride: null,
    effectivePrice: 18000,
    createdAt: now,
    updatedAt: now,
  };
}

const USERS = [
  { id: "u-owner", name: "Carolina Vélez", email: "carolina@e2e.co", role: "OWNER", active: true },
  { id: "u-admin", name: "Andrés Rojas", email: "andres@e2e.co", role: "ADMIN", active: true },
  { id: "u-op1", name: "Laura Gómez", email: null, role: "OPERATOR", active: true },
  { id: "u-op2", name: "Mateo Cruz", email: null, role: "OPERATOR", active: false },
].map((user) => ({
  ...user,
  phoneNumber: "+573001112233",
  businessId: "e2e-test-business-id",
  operatorProfileId: null,
  createdAt: now,
  updatedAt: now,
}));

/** Productos, categorías, inventario, usuarios y límite de sedes. */
async function mockCatalogAndSettings(page: Page, patches: unknown[] = []): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (/\/products\/[^/]+$/.test(path) && request.method() === "PATCH") {
      patches.push(request.postDataJSON());
      return json(product("p-1", "Hamburguesa clásica", 18000, false));
    }
    if (path.endsWith("/products")) {
      const items = [
        product("p-1", "Hamburguesa clásica", 18000),
        product("p-2", "Hamburguesa doble", 26000),
        product("p-3", "Pizza vegetariana", 23000, false),
      ];
      const isActive = url.searchParams.get("isActive");
      const filtered =
        isActive === null ? items : items.filter((item) => String(item.isActive) === isActive);
      return json({
        items: filtered,
        total: filtered.length,
        page: 1,
        limit: 20,
        counts: { total: 3, fromTemplate: 0, custom: 3 },
      });
    }
    if (path.includes("/business-categories")) {
      return json([
        {
          id: "cat-burgers",
          name: "Hamburguesas",
          slug: "hamburguesas",
          description: null,
          industryCategoryId: "ic-1",
          businessId: "e2e-test-business-id",
          isActive: true,
          order: 1,
          searchKeywords: [{ value: "burger", source: "manual" }],
        },
        {
          id: "cat-drinks",
          name: "Bebidas",
          slug: "bebidas",
          description: null,
          industryCategoryId: "ic-2",
          businessId: "e2e-test-business-id",
          isActive: true,
          order: 2,
          searchKeywords: [],
        },
      ]);
    }
    if (path.endsWith("/inventory")) {
      const items = [
        inventoryItem("i-1", "Hamburguesa clásica", 0),
        inventoryItem("i-2", "Hamburguesa doble", 4),
        inventoryItem("i-3", "Limonada natural", null),
        inventoryItem("i-4", "Gaseosa", 30, false),
      ];
      return json({ items, total: items.length, page: 1, limit: 100 });
    }
    if (path.includes("/users")) return json(USERS);
    if (path.endsWith("/branches/can-create")) {
      return json({ allowed: true, current: 1, max: 3, remaining: 2 });
    }
    return route.fallback();
  });
}

async function login(page: Page, patches?: unknown[]): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // El botón flotante de React Query Devtools (solo en desarrollo) tapa
    // los controles de abajo a la derecha.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = ".tsqd-parent-container { display: none !important; }";
      document.head.appendChild(style);
    });
  });
  await blockUnmockedApiCalls(page);
  await blockRealtimeSockets(page);
  await mockLoginSuccess(page);
  await mockOrdersDashboard(page);
  await mockBranches(page);
  await mockRefreshSuccess(page);
  await mockCatalogAndSettings(page, patches);
  await mockBoardPermissions(page, PERMISSIONS);
  await openBoard(page);
}

test.describe("Menú del teléfono", () => {
  test("Catálogo, Configuración y Conversaciones son una sola entrada", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Abrir menú" }).click();

    await expect(page.getByRole("link", { name: "Catálogo" })).toHaveAttribute(
      "href",
      /\/dashboard\/catalog\/products\/?$/
    );
    await expect(page.getByRole("link", { name: "Configuración" })).toHaveAttribute(
      "href",
      /\/dashboard\/settings\/?$/
    );
    await expect(page.getByRole("link", { name: "Conversaciones" })).toHaveAttribute(
      "href",
      /\/dashboard\/inbox\/?$/
    );
    // Sus hermanas viven en la barra inferior / la lista, no en el menú.
    await expect(page.getByRole("link", { name: /Inventario/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Embudo del bot" })).toHaveCount(0);
  });
});

test.describe("Catálogo en el teléfono", () => {
  test("productos: filtra por estado y apaga un producto desde la lista", async ({ page }) => {
    const patches: unknown[] = [];
    await login(page, patches);
    await page.goto("/es/dashboard/catalog/products");

    const view = page.getByTestId("products-mobile-view");
    await expect(view.getByText("Hamburguesa clásica")).toBeVisible();
    await expect(view.getByText("Pizza vegetariana")).toBeVisible();

    await view.getByRole("button", { name: "Inactivos" }).click();
    await expect(view.getByText("Hamburguesa clásica")).toHaveCount(0);
    await expect(view.getByText("Pizza vegetariana")).toBeVisible();

    await view.getByRole("button", { name: "Todos", exact: true }).click();
    await view.getByRole("switch", { name: "Hamburguesa clásica activo" }).click();
    await expect.poll(() => patches).toContainEqual({ isActive: false });

    await expect(page.getByTestId("products-mobile-create")).toBeVisible();
    const nav = page.getByTestId("catalog-mobile-nav");
    await expect(nav.getByRole("link", { name: "Productos" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Inventario" }).click();
    await expect(page).toHaveURL(/\/dashboard\/inventory/);
  });

  test("inventario: stock por estado con sus contadores, de solo lectura", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/inventory");

    const view = page.getByTestId("inventory-mobile-view");
    await expect(view.getByText("Hamburguesa clásica")).toBeVisible();
    // La variante por defecto no se repite junto al nombre.
    await expect(view.getByText("Hamburguesa clásica · Unidad")).toHaveCount(0);
    await expect(view.getByRole("button", { name: /Agotados/ })).toContainText("1");
    await expect(view.getByRole("button", { name: /Stock bajo/ })).toContainText("1");

    await view.getByRole("button", { name: /No disponibles/ }).click();
    await expect(view.getByText("Gaseosa")).toBeVisible();
    await expect(view.getByText("Hamburguesa doble")).toHaveCount(0);
    await expect(view.getByRole("switch")).toHaveCount(0);
  });

  test("categorías: busca y crea desde el botón flotante", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/catalog/categories");

    const list = page.getByTestId("categories-mobile-list");
    await expect(list.getByText("Palabras clave: burger")).toBeVisible();
    await list.getByRole("searchbox").fill("bebi");
    await expect(list.getByText("Hamburguesas")).toHaveCount(0);
    await expect(list.getByText("Bebidas")).toBeVisible();

    await page.getByTestId("categories-mobile-create").click();
    await expect(page.getByLabel(/Nombre/).first()).toBeVisible();
  });
});

test.describe("Configuración en el teléfono", () => {
  test("la lista lleva a cada pantalla y la barra superior vuelve", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings");

    const hub = page.getByTestId("settings-mobile-hub");
    await expect(hub.getByRole("link", { name: /Facturación/ })).toBeVisible();
    await hub.getByRole("link", { name: /Usuarios/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings\/users/);
    await expect(page.getByTestId("mobile-section-title")).toHaveText("Usuarios");

    await page.getByTestId("mobile-back").click();
    await expect(page).toHaveURL(/\/dashboard\/settings\/?$/);
    await expect(page.getByTestId("settings-mobile-hub")).toBeVisible();
  });

  test("usuarios: filtra por rol y cada fila abre su detalle", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings/users");

    const view = page.getByTestId("users-mobile-view");
    await expect(view.getByRole("button", { name: /Operadores/ })).toContainText("2");
    await view.getByRole("button", { name: /Operadores/ }).click();
    await expect(view.getByText("Carolina Vélez")).toHaveCount(0);
    await expect(view.getByText("Laura Gómez")).toBeVisible();
    await expect(view.getByRole("link", { name: /Mateo Cruz/ })).toHaveAttribute(
      "href",
      /\/dashboard\/users\/u-op2/
    );
  });
});
