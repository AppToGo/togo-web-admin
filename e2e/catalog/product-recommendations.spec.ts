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

function variant(id: string, isDefault: boolean) {
  return {
    id,
    productId: "p-pizza",
    businessId: "e2e-test-business-id",
    attributes: {},
    variantLabel: id,
    price: 30000,
    isActive: true,
    isDefault,
    createdAt: now,
    updatedAt: now,
  };
}

const PRODUCTS = [
  product("p-burger", "Hamburguesa clásica", 18900, "cat-burgers"),
  // Varias presentaciones y ninguna predeterminada: no se puede recomendar.
  {
    ...product("p-pizza", "Pizza familiar", 30000, "cat-burgers"),
    variants: [variant("Mediana", false), variant("Grande", false)],
  },
  product("p-papas", "Papas fritas", 7900, "cat-sides"),
  product("p-aros", "Aros de cebolla", 8500, "cat-sides"),
  product("p-gaseosa", "Gaseosa 400 ml", 4500, "cat-drinks"),
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
      const body = request.postDataJSON() as { recommendedProductIds: string[] };
      saved.push(body);
      return json({
        productId: recs[1],
        recommendations: body.recommendedProductIds.map(recommended),
      });
    }
    if (recs) {
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
    await expect(drawer.getByRole("heading", { name: "Ofrecerle · 1" })).toBeVisible();
    // El producto pedido no se ofrece a sí mismo.
    await expect(
      drawer.getByRole("button", { name: "Agregar Hamburguesa clásica" })
    ).toHaveCount(0);

    // Sin presentación predeterminada no se puede elegir.
    await expect(
      drawer.getByRole("button", { name: "Agregar Pizza familiar" })
    ).toBeDisabled();
    await expect(
      drawer.getByText(/ninguna predeterminada/)
    ).toBeVisible();

    // Filtro por categoría y agregar.
    await drawer.getByRole("button", { name: "Bebidas" }).click();
    await expect(drawer.getByRole("button", { name: "Agregar Aros de cebolla" })).toHaveCount(0);
    await drawer.getByRole("button", { name: "Agregar Gaseosa 400 ml" }).click();
    await expect(drawer.getByRole("heading", { name: "Ofrecerle · 2" })).toBeVisible();

    // Buscador (sin tildes) y quitar el que ya estaba.
    await drawer.getByRole("button", { name: "Todas" }).click();
    await drawer.getByPlaceholder("Buscar producto").fill("aros");
    await drawer.getByRole("button", { name: "Agregar Aros de cebolla" }).click();
    await drawer.getByRole("button", { name: "Quitar Papas fritas" }).first().click();

    await drawer.getByRole("button", { name: "Guardar recomendaciones · 2" }).click();
    await expect.poll(() => saved).toEqual([
      { recommendedProductIds: ["p-gaseosa", "p-aros"] },
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
