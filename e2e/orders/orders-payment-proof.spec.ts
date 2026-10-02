import { test, expect, type Page } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";

/**
 * Regresión: el visor "Comprobante de pago" abierto DESDE el detalle del
 * pedido (drawer de vaul) debe seguir recibiendo clicks.
 *
 * El drawer modal de vaul (vía Radix DismissableLayer) pone
 * `body { pointer-events: none }` mientras está abierto. El `Dialog`
 * propio es un portal manual al body sin `pointer-events: auto`, así que
 * el visor se veía pero el botón "Pago recibido", el enlace "Abrir en
 * otra pestaña" y hasta la X estaban muertos. Desde la tarjeta del
 * tablero (sin drawer) sí funcionaba.
 */

const BUSINESS_ID = "e2e-test-business-id";
const BRANCH_ID = "e2e-test-branch-id";

const PROOF_ORDER = {
  id: "proof01",
  orderNumber: 104,
  status: "CONFIRMED",
  paymentStatus: "PENDING",
  paymentMethod: "TRANSFER",
  paymentProofUrl: "proof-key-123",
  subtotal: 20000,
  tax: 0,
  total: 20000,
  totalAmount: 20000,
  customerId: "cust-e2e",
  businessId: BUSINESS_ID,
  branchId: BRANCH_ID,
  deliveryType: "PICKUP",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customer: { id: "cust-e2e", name: "Cliente E2E", phoneNumber: "+573000000000" },
  items: [{ id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 }],
};

const LATEST_MEDIA = {
  kind: "EXTERNAL_URL",
  url: "https://example.com/comprobante.png",
  mimeType: "image/png",
  filename: "comprobante.png",
};

const OLDER_MEDIA = {
  kind: "EXTERNAL_URL",
  url: "https://example.com/comprobante-anterior.png",
  mimeType: "image/png",
  filename: "comprobante-anterior.png",
};

/**
 * Los comprobantes viejos guardaron el media id de WhatsApp, que expira: el
 * endpoint los devuelve con `url: null` y un motivo.
 */
const EXPIRED_MEDIA = {
  kind: "WHATSAPP_MEDIA_ID",
  url: null,
  mimeType: null,
  filename: null,
  unavailableReason: "WHATSAPP_MEDIA_NOT_ARCHIVED",
};

/**
 * Dos comprobantes del mismo pedido: el cliente puede mandar una captura más
 * clara, y el operador los mira todos antes de marcar el pago. `media` es el
 * más reciente y `proofs[0]` el mismo, para no romper a quien ya consumía
 * esta respuesta.
 */
const PROOF_PAYLOAD = {
  receivedAt: new Date().toISOString(),
  proofType: "image",
  media: LATEST_MEDIA,
  proofs: [
    {
      receivedAt: new Date().toISOString(),
      proofType: "image",
      media: LATEST_MEDIA,
    },
    {
      receivedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
      proofType: "image",
      media: OLDER_MEDIA,
    },
  ],
};

/** Endpoints del escenario. Registrar DESPUÉS de mockOrdersDashboard. */
async function mockProofScenario(page: Page, onPaymentUpdate: (body: unknown) => void) {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/auth/me/permissions")) {
      return json(["order.view", "order.create", "conversation.takeover"]);
    }
    if (path.endsWith("/orders/proof01/payment-proof")) return json(PROOF_PAYLOAD);
    if (path.endsWith("/orders/proof01/history")) return json([]);
    if (path.endsWith("/orders/proof01/payment-status") && request.method() === "PATCH") {
      onPaymentUpdate(request.postDataJSON());
      return json({ ...PROOF_ORDER, paymentStatus: "PAID" });
    }
    if (path.endsWith("/orders/proof01")) return json(PROOF_ORDER);
    if (path.endsWith("/orders") && !url.searchParams.get("status")) {
      return json([PROOF_ORDER]);
    }
    await route.fallback();
  });
}

async function openBoard(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials("test@togo.com", "any-password");
  await loginPage.submit();
  await loginPage.waitForDashboardRedirect();

  await expect(page.getByRole("button", { name: "Nuevo pedido" })).toBeVisible();

  // Mismos overlays que descartan los otros specs de orders.
  await page
    .getByRole("button", { name: /saltar tour/i })
    .click({ timeout: 5_000 })
    .catch(() => undefined);
  await page
    .getByText("¡Bienvenido! Inicio de sesión exitoso")
    .waitFor({ state: "hidden", timeout: 15_000 })
    .catch(() => undefined);
  await page
    .getByText("Continuar con plan gratuito")
    .click({ timeout: 5_000 })
    .catch(() => undefined);
}

test.describe("Orders — comprobante de pago desde el detalle", () => {
  let paymentUpdates: unknown[];

  test.beforeEach(async ({ page }) => {
    paymentUpdates = [];
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockProofScenario(page, (body) => paymentUpdates.push(body));
  });

  test("el visor recibe clicks: enlace externo y Pago recibido", async ({ page }) => {
    await openBoard(page);

    // Abrir el detalle (drawer lateral de vaul).
    await page.getByText("#104").click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: "Detalle del Pedido" })).toBeVisible();

    // Abrir el visor desde el detalle.
    await drawer.getByRole("button", { name: "Ver el comprobante de pago" }).click();
    await expect(
      page.getByRole("heading", { name: "Comprobante de pago" })
    ).toBeVisible();

    // El enlace a otra pestaña apunta a la URL firmada y es accionable.
    const externalLink = page.getByRole("link", { name: "Abrir en otra pestaña" });
    await expect(externalLink).toHaveAttribute("href", PROOF_PAYLOAD.media.url);

    // El botón confirma el pago: dispara el PATCH y cierra el visor.
    await page.getByRole("button", { name: "Pago recibido" }).click();
    await expect(
      page.getByRole("heading", { name: "Comprobante de pago" })
    ).toHaveCount(0);
    expect(paymentUpdates).toEqual([
      { paymentStatus: "PAID", changeNotes: "Pago confirmado desde panel admin" },
    ]);
  });

  test("el operador puede pasar entre los comprobantes recibidos", async ({
    page,
  }) => {
    // Con más de uno aparece el selector; el visor arranca en el más reciente
    // porque es el que el cliente quiere que miren.
    await openBoard(page);

    await page.getByText("#104").click();
    const drawer = page.getByRole("dialog");
    await drawer
      .getByRole("button", { name: "Ver el comprobante de pago" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Comprobante de pago" }),
    ).toBeVisible();

    // Arranca en el más reciente.
    await expect(
      page.getByRole("img", { name: "Comprobante de pago" }),
    ).toHaveAttribute("src", LATEST_MEDIA.url);

    // El selector aparece sólo con más de uno.
    await expect(page.getByText("2 comprobantes recibidos")).toBeVisible();

    // Pasar al anterior: el botón lleva su hora.
    await page
      .getByRole("button", { name: /^\d{1,2}:\d{2}/ })
      .first()
      .click();

    await expect(
      page.getByRole("img", { name: "Comprobante de pago" }),
    ).toHaveAttribute("src", OLDER_MEDIA.url);
  });

  test("elegir un comprobante que ya no está no deja al operador encerrado", async ({
    page,
  }) => {
    // El aviso de "no disponible" no puede reemplazar al selector: si lo
    // hiciera, elegir uno expirado dejaba sin forma de volver al que sí se ve.
    await page.route("**/orders/proof01/payment-proof", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...PROOF_PAYLOAD,
          proofs: [
            PROOF_PAYLOAD.proofs[0],
            { ...PROOF_PAYLOAD.proofs[1], media: EXPIRED_MEDIA },
          ],
        }),
      })
    );

    await openBoard(page);
    await page.getByText("#104").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Ver el comprobante de pago" })
      .click();

    await page
      .getByRole("button", { name: /^\d{1,2}:\d{2}/ })
      .first()
      .click();

    // Se ve el aviso, y el selector sigue ahí para poder volver.
    await expect(page.getByText(/ya no está/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "El último" })).toBeVisible();

    await page.getByRole("button", { name: "El último" }).click();
    await expect(
      page.getByRole("img", { name: "Comprobante de pago" })
    ).toHaveAttribute("src", LATEST_MEDIA.url);
  });
});
