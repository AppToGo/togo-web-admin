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
 * Recomendados desde la pantalla de productos: la acción "Agregar
 * recomendación" del menú de cada producto abre el drawer con el producto
 * arriba, sus recomendados y la lista de todos los productos para sumar o
 * quitar. Guardar manda la lista completa (PUT) en el orden elegido.
 */

const PERMISSIONS = [
  "order.view",
  "order.create",
  "recommendation.view",
  "recommendation.create",
];

const now = new Date().toISOString();

function product(id: string, name: string, price: number, categoryId: string) {
  return {
    id,
    businessId: "e2e-test-business-id",
    name,
    slug: id,
    kind: "SIMPLE",
    businessCategoryId: categoryId,
    isActive: true,
    isFeatured: false,
    searchKeywords: [],
    variantCount: 1,
    priceFrom: price,
    priceTo: price,
    createdAt: now,
    updatedAt: now,
  };
}

function variant(
  id: string,
  productId: string,
  label: string,
  price: number,
  opts: { isDefault?: boolean; internalSku?: string } = {}
) {
  return {
    id,
    productId,
    businessId: "e2e-test-business-id",
    attributes: {},
    variantLabel: label,
    price,
    internalSku: opts.internalSku,
    isActive: true,
    isDefault: opts.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  };
}

const PRODUCTS = [
  {
    ...product("p-burger", "Hamburguesa clásica", 18900, "cat-burgers"),
    variants: [variant("v-burger", "p-burger", "Unidad", 18900, { isDefault: true })],
  },
  // Varias presentaciones y ninguna predeterminada: cada una se recomienda
  // por separado (nuevo flujo por variante).
  {
    ...product("p-pizza", "Pizza familiar", 30000, "cat-burgers"),
    variants: [
      variant("v-mediana", "p-pizza", "Mediana", 30000, { internalSku: "B010" }),
      variant("v-grande", "p-pizza", "Grande", 38000, { internalSku: "B011" }),
    ],
  },
  {
    ...product("p-papas", "Papas fritas", 7900, "cat-sides"),
    variants: [variant("v-papas", "p-papas", "", 7900, { isDefault: true })],
  },
  {
    ...product("p-aros", "Aros de cebolla", 8500, "cat-sides"),
    variants: [variant("v-aros", "p-aros", "", 8500, { isDefault: true })],
  },
  {
    ...product("p-gaseosa", "Gaseosa", 4500, "cat-drinks"),
    variants: [variant("v-gaseosa", "p-gaseosa", "400 ml", 4500, { isDefault: true, internalSku: "B042" })],
  },
];

const CATEGORIES = [
  ["cat-burgers", "Hamburguesas"],
  ["cat-sides", "Acompañamientos"],
  ["cat-drinks", "Bebidas"],
].map(([id, name], i) => ({
  id,
  name,
  slug: id,
  description: null,
  industryCategoryId: `ic-${i}`,
  businessId: "e2e-test-business-id",
  isActive: true,
  order: i,
  searchKeywords: [],
}));

function recommended(id: string) {
  const p = PRODUCTS.find((item) => item.id === id)!;
  return { id: p.id, name: p.name, price: p.priceFrom, isActive: true };
}

/** Fila guardada a nivel variante, como la devuelve la API. */
function recommendedVariant(variantId: string) {
  const p = PRODUCTS.find((item) =>
    (item.variants ?? []).some((v: { id: string }) => v.id === variantId)
  )!;
  const v = (p.variants ?? []).find((vv: { id: string }) => vv.id === variantId)!;
  return {
    id: p.id,
    name: p.name,
    price: v.price,
    isActive: true,
    variantId: v.id,
    variantLabel: v.variantLabel,
    internalSku: v.internalSku,
  };
}

async function mockCatalog(page: Page, saved: unknown[]): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/product-recommendations/counts")) {
      return json({ "p-burger": 1 });
    }
    const recs = path.match(/\/products\/([^/]+)\/recommendations$/);
    if (recs && request.method() === "PUT") {
      const body = request.postDataJSON() as { recommendedVariantIds: string[] };
      saved.push(body);
      return json({
        productId: recs[1],
        recommendations: body.recommendedVariantIds.map(recommendedVariant),
      });
    }
    if (recs) {
      // Legado a nivel producto: el drawer lo resuelve a su única variante.
      return json({ productId: recs[1], recommendations: [recommended("p-papas")] });
    }
    if (path.endsWith("/products")) {
      return json({
        items: PRODUCTS,
        total: PRODUCTS.length,
        page: 1,
        limit: 20,
        counts: { total: PRODUCTS.length, fromTemplate: 0, custom: PRODUCTS.length },
      });
    }
    if (path.includes("/business-categories")) return json(CATEGORIES);
    return route.fallback();
  });
}

async function login(page: Page, saved: unknown[], permissions = PERMISSIONS) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
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
  await mockCatalog(page, saved);
  await mockBoardPermissions(page, permissions);
  await openBoard(page);
}

async function openRecommendations(page: Page, productName: string) {
  const card = page.locator(".group", { hasText: productName }).first();
  await card.hover();
  await card.getByRole("button", { name: "Acciones" }).click();
  await page.getByRole("menuitem", { name: "Agregar recomendación" }).click();
  return page.getByTestId("product-recommendations-drawer");
}

test.describe("Recomendados de un producto", () => {
  test("elige recomendados desde la lista de productos y guarda la lista en orden", async ({
    page,
  }) => {
    const saved: unknown[] = [];
    await login(page, saved);
    await page.goto("/es/dashboard/catalog/products");

    // La etiqueta sale del conteo por producto.
    await expect(page.getByText("1 recomendado")).toBeVisible();

    const drawer = await openRecommendations(page, "Hamburguesa clásica");
    await expect(drawer.getByText("Cuando el cliente pida")).toBeVisible();
    // La fila legado (producto sin variante) se resolvió a su única variante.
    await expect(drawer.getByRole("heading", { name: "Ofrecerle · 1" })).toBeVisible();
    // El producto pedido no se ofrece a sí mismo.
    await expect(
      drawer.getByRole("button", { name: /Hamburguesa clásica/ })
    ).toHaveCount(0);

    // Sin predeterminada también se puede: cada presentación es elegible.
    await expect(
      drawer.getByRole("button", { name: "Agregar Pizza familiar · Mediana" })
    ).toBeEnabled();
    await drawer.getByRole("button", { name: "Agregar Pizza familiar · Grande" }).click();
    await expect(drawer.getByRole("heading", { name: "Ofrecerle · 2" })).toBeVisible();

    // Filtro por categoría, código visible y agregar.
    await drawer.getByRole("button", { name: "Bebidas" }).click();
    await expect(drawer.getByRole("button", { name: "Agregar Aros de cebolla" })).toHaveCount(0);
    await expect(drawer.getByText("B042").first()).toBeVisible();
    await drawer.getByRole("button", { name: "Agregar Gaseosa · 400 ml" }).click();
    await expect(drawer.getByRole("heading", { name: "Ofrecerle · 3" })).toBeVisible();

    // Buscador (sin tildes) y quitar el que ya estaba.
    await drawer.getByRole("button", { name: "Todas" }).click();
    await drawer.getByPlaceholder("Buscar por nombre, presentación o código").fill("aros");
    await drawer.getByRole("button", { name: "Agregar Aros de cebolla" }).click();
    await drawer.getByRole("button", { name: "Quitar Papas fritas" }).first().click();

    await drawer.getByRole("button", { name: "Guardar recomendaciones · 3" }).click();
    await expect.poll(() => saved).toEqual([
      { recommendedVariantIds: ["v-grande", "v-gaseosa", "v-aros"] },
    ]);
    await expect(page.getByText("Recomendaciones guardadas")).toBeVisible();
    await expect(drawer).toBeHidden();
  });

  test("sin permiso para crear no se muestra la acción", async ({ page }) => {
    await login(page, [], ["order.view", "order.create", "recommendation.view"]);
    await page.goto("/es/dashboard/catalog/products");

    const card = page.locator(".group", { hasText: "Hamburguesa clásica" }).first();
    await card.hover();
    await card.getByRole("button", { name: "Acciones" }).click();
    await expect(page.getByRole("menuitem", { name: "Editar" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Agregar recomendación" })).toHaveCount(0);
  });
});
