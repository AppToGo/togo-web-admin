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
 * Destacados del catálogo desde la pantalla de productos: la estrella de
 * cada tarjeta abre el drawer "Destacar producto" (producto en solo
 * lectura, sedes con su cupo de 10 e imagen obligatoria) o, si el producto
 * ya está destacado en la sede del filtro, lo quita de esa sede. Guardar
 * manda el conjunto completo de sedes (PUT) y, si se subió, la imagen.
 */

const PERMISSIONS = ["order.view", "order.create", "product.view", "product.update"];

const CENTRO = "branch-centro";
const NORTE = "branch-norte";

// Imágenes inline: el drawer las pinta y una URL sin servidor dispararía
// onError, que el drawer trata como "sin imagen".
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const UPLOADED = `${PIXEL}#subida`;

const now = new Date().toISOString();

function product(id: string, name: string, price: number, image?: string) {
  return {
    id,
    businessId: "e2e-test-business-id",
    name,
    description: `Descripción de ${name}`,
    image,
    slug: id,
    kind: "SIMPLE",
    businessCategoryId: "cat-menu",
    isActive: true,
    isFeatured: false,
    searchKeywords: [],
    variantCount: 1,
    priceFrom: price,
    priceTo: price,
    variants: [
      {
        id: `${id}-v`,
        productId: id,
        businessId: "e2e-test-business-id",
        attributes: {},
        variantLabel: "Unidad",
        price,
        isActive: true,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

const PRODUCTS = [
  product("p-burger", "Hamburguesa clásica", 18900),
  product("p-papas", "Papas fritas", 7900, PIXEL),
  product("p-gaseosa", "Gaseosa 400 ml", 4500, PIXEL),
];

const CATEGORIES = [
  {
    id: "cat-menu",
    name: "Menú",
    slug: "menu",
    description: null,
    industryCategoryId: "ic-0",
    businessId: "e2e-test-business-id",
    isActive: true,
    order: 0,
    searchKeywords: [],
  },
];

interface Recorded {
  saved: Array<{ productId: string; body: unknown }>;
  productQueries: URLSearchParams[];
}

async function mockCatalog(
  page: Page,
  recorded: Recorded,
  opts: { putError?: { code: string; branchIds?: string[] }; summaryFails?: boolean } = {}
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/featured-products")) {
      if (opts.summaryFails) return json({ statusCode: 500, message: "Error" }, 500);
      // Sede Norte ya está llena; las Papas están destacadas en Centro.
      return json({
        limit: 10,
        branchCounts: { [CENTRO]: 1, [NORTE]: 10 },
        byProduct: { "p-papas": [CENTRO] },
      });
    }
    const featured = path.match(/\/products\/([^/]+)\/featured$/);
    if (featured && request.method() === "PUT") {
      const body = request.postDataJSON() as { branchIds: string[]; image?: string };
      recorded.saved.push({ productId: featured[1], body });
      if (opts.putError) {
        return json({ statusCode: 400, message: "Error", ...opts.putError }, 400);
      }
      return json({ productId: featured[1], branchIds: body.branchIds, image: body.image ?? PIXEL });
    }
    if (path.endsWith("/products/upload-image") && request.method() === "POST") {
      return json({ imageUrl: UPLOADED }, 201);
    }
    if (path.endsWith("/products")) {
      recorded.productQueries.push(url.searchParams);
      const items =
        url.searchParams.get("featuredOnly") === "true"
          ? PRODUCTS.filter((p) => p.id === "p-papas")
          : PRODUCTS;
      return json({
        items,
        total: items.length,
        page: 1,
        limit: 20,
        counts: { total: PRODUCTS.length, fromTemplate: 0, custom: PRODUCTS.length },
      });
    }
    if (path.includes("/business-categories")) return json(CATEGORIES);
    return route.fallback();
  });
}

async function login(
  page: Page,
  recorded: Recorded,
  opts: {
    permissions?: string[];
    putError?: { code: string; branchIds?: string[] };
    summaryFails?: boolean;
  } = {}
) {
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
  await mockCatalog(page, recorded, {
    putError: opts.putError,
    summaryFails: opts.summaryFails,
  });
  await mockBoardPermissions(page, opts.permissions ?? PERMISSIONS);
  await openBoard(page);
}

function newRecorded(): Recorded {
  return { saved: [], productQueries: [] };
}

async function openProducts(page: Page) {
  await page.goto("/es/dashboard/catalog/products");
  await expect(page.getByText("Hamburguesa clásica").first()).toBeVisible();
}

async function filterByBranch(page: Page, branchName: string) {
  await page.getByRole("button", { name: "Todas las sedes" }).click();
  await page.locator('[role="dialog"]').getByRole("button", { name: branchName }).click();
  await page.keyboard.press("Escape");
}

test.describe("Destacados del catálogo", () => {
  test("destaca un producto sin imagen: la sede del filtro viene marcada y la imagen es obligatoria", async ({
    page,
  }) => {
    const recorded = newRecorded();
    await login(page, recorded);
    await openProducts(page);
    await filterByBranch(page, "Sede Centro");

    await page
      .getByRole("button", { name: "Destacar Hamburguesa clásica en el catálogo" })
      .first()
      .click();
    const drawer = page.getByTestId("feature-product-drawer");

    // Producto en solo lectura arriba.
    await expect(drawer.getByText("Solo lectura")).toBeVisible();
    await expect(drawer.getByText("Hamburguesa clásica", { exact: true })).toBeVisible();
    await expect(drawer.getByText("Descripción de Hamburguesa clásica")).toBeVisible();
    await expect(drawer.getByRole("textbox")).toHaveCount(0);

    // La sede del filtro viene marcada; la sede llena (10/10) no se puede elegir.
    await expect(drawer.getByRole("checkbox", { name: /Sede Centro/ })).toBeChecked();
    await expect(drawer.getByText("1/10")).toBeVisible();
    await expect(drawer.getByRole("checkbox", { name: /Sede Norte/ })).toBeDisabled();
    await expect(drawer.getByText("Límite de 10 destacados alcanzado")).toBeVisible();

    // Sin imagen no se puede destacar.
    await expect(drawer.getByText(/Este producto no tiene imagen/)).toBeVisible();
    const submit = drawer.getByRole("button", { name: "Destacar producto" });
    await expect(submit).toBeDisabled();

    await drawer.locator('input[type="file"]').setInputFiles({
      name: "burger.png",
      mimeType: "image/png",
      buffer: Buffer.from(PIXEL.split(",")[1], "base64"),
    });
    await expect(drawer.getByText("Imagen lista")).toBeVisible();
    await expect(submit).toBeEnabled();

    await submit.click();
    await expect.poll(() => recorded.saved).toEqual([
      { productId: "p-burger", body: { branchIds: [CENTRO], image: UPLOADED } },
    ]);
    await expect(page.getByText("Producto destacado")).toBeVisible();
    await expect(drawer).toBeHidden();
  });

  test("producto con imagen: usa la actual y avisa si la sede ya llegó al tope", async ({
    page,
  }) => {
    const recorded = newRecorded();
    await login(page, recorded, {
      putError: { code: "FEATURED_LIMIT_REACHED", branchIds: [CENTRO] },
    });
    await openProducts(page);

    // Sin filtro de sede no se preselecciona ninguna.
    await page
      .getByRole("button", { name: "Destacar Gaseosa 400 ml en el catálogo" })
      .first()
      .click();
    const drawer = page.getByTestId("feature-product-drawer");
    await expect(drawer.getByText("Usaremos la imagen actual del producto")).toBeVisible();
    await expect(drawer.getByRole("checkbox", { name: /Sede Centro/ })).not.toBeChecked();
    const submit = drawer.getByRole("button", { name: "Destacar producto" });
    await expect(submit).toBeDisabled();

    await drawer.getByRole("checkbox", { name: /Sede Centro/ }).click();
    await submit.click();

    // Sin imagen nueva el PUT no la manda.
    await expect.poll(() => recorded.saved).toEqual([
      { productId: "p-gaseosa", body: { branchIds: [CENTRO] } },
    ]);
    await expect(page.getByText("Una sede ya tiene el máximo de 10 destacados")).toBeVisible();
    await expect(drawer).toBeVisible();
  });

  test("con la sede del filtro llena no la preselecciona y deja destacar en otra", async ({
    page,
  }) => {
    const recorded = newRecorded();
    await login(page, recorded);
    await openProducts(page);
    await filterByBranch(page, "Sede Norte");

    await page
      .getByRole("button", { name: "Destacar Gaseosa 400 ml en el catálogo" })
      .first()
      .click();
    const drawer = page.getByTestId("feature-product-drawer");

    // Norte (10/10) no viene marcada: marcada y llena, todo guardado fallaría.
    const norte = drawer.getByRole("checkbox", { name: /Sede Norte/ });
    await expect(norte).not.toBeChecked();
    await expect(norte).toBeDisabled();

    await drawer.getByRole("checkbox", { name: /Sede Centro/ }).click();
    await drawer.getByRole("button", { name: "Destacar producto" }).click();

    await expect.poll(() => recorded.saved).toEqual([
      { productId: "p-gaseosa", body: { branchIds: [CENTRO] } },
    ]);
  });

  test("si el resumen de destacados no carga, la estrella no permite guardar", async ({
    page,
  }) => {
    const recorded = newRecorded();
    await login(page, recorded, { summaryFails: true });
    await openProducts(page);

    // Sin el resumen no se sabe dónde está destacado cada producto: guardar
    // reemplazaría las sedes reales, así que la estrella queda deshabilitada.
    const star = page
      .getByRole("button", { name: "Destacar Papas fritas en el catálogo" })
      .first();
    await expect(star).toBeDisabled();
    await star.click({ force: true });
    await expect(page.getByTestId("feature-product-drawer")).toBeHidden();
    expect(recorded.saved).toEqual([]);
  });

  test("la estrella rellena quita el destacado de la sede del filtro sin abrir el drawer", async ({
    page,
  }) => {
    const recorded = newRecorded();
    await login(page, recorded);
    await openProducts(page);
    await filterByBranch(page, "Sede Centro");

    const star = page.getByRole("button", { name: "Quitar Papas fritas de destacados" }).first();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await star.click();

    await expect.poll(() => recorded.saved).toEqual([
      { productId: "p-papas", body: { branchIds: [] } },
    ]);
    await expect(page.getByText("Producto quitado de destacados en esta sede")).toBeVisible();
    await expect(page.getByTestId("feature-product-drawer")).toBeHidden();
  });

  test("el filtro Solo destacados pide featuredOnly a la API", async ({ page }) => {
    const recorded = newRecorded();
    await login(page, recorded);
    await openProducts(page);

    await page.getByTitle("Filtrar").click();
    await page.getByText("Solo destacados").click();

    await expect
      .poll(() => recorded.productQueries.some((q) => q.get("featuredOnly") === "true"))
      .toBe(true);
    await expect(page.getByText("Hamburguesa clásica")).toHaveCount(0);
    await expect(page.getByText("Papas fritas").first()).toBeVisible();
  });

  test("sin permiso para editar productos no se muestra la estrella", async ({ page }) => {
    await login(page, newRecorded(), {
      permissions: ["order.view", "order.create", "product.view"],
    });
    await openProducts(page);

    await expect(
      page.getByRole("button", { name: "Destacar Hamburguesa clásica en el catálogo" })
    ).toHaveCount(0);
  });
});
