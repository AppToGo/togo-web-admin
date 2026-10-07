import { test, expect, type Page } from "playwright/test";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";
import {
  openBoard,
  mockBoardPermissions,
  blockUnmockedApiCalls,
  blockRealtimeSockets,
  mockRefreshSuccess,
} from "./board";

/**
 * Proof confidence rating (Parte 4).
 *
 * Complements orders-payment-proof.spec.ts (which already covers LOW,
 * HIGH and quota-exceeded indicators): MEDIUM, PENDING analysis, missing
 * verification, and a viewer whose comparison flags a mismatch.
 */

const BUSINESS_ID = "e2e-test-business-id";
const BRANCH_ID = "e2e-test-branch-id";

function proofOrder(id: string, orderNumber: number, paymentVerification?: unknown) {
  const now = new Date().toISOString();
  return {
    id,
    orderNumber,
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    paymentMethod: "TRANSFER",
    paymentProofUrl: "proof-key-123",
    ...(paymentVerification !== undefined ? { paymentVerification } : {}),
    subtotal: 20000,
    tax: 0,
    total: 20000,
    totalAmount: 20000,
    customerId: "cust-e2e",
    businessId: BUSINESS_ID,
    branchId: BRANCH_ID,
    deliveryType: "PICKUP",
    createdAt: now,
    updatedAt: now,
    customer: { id: "cust-e2e", name: "Cliente E2E", phoneNumber: "+573000000000" },
    items: [{ id: "item-1", productName: "Producto E2E", quantity: 1, unitPrice: 20000 }],
  };
}

const PROOF_MEDIA = {
  kind: "EXTERNAL_URL",
  url: "https://example.com/comprobante.png",
  mimeType: "image/png",
  filename: "comprobante.png",
};

function verificationPayload(comparison: Array<Record<string, unknown>>, riskLevel: string, score: number | null) {
  return {
    id: "verif-1",
    orderId: "conf1",
    analysisStatus: score === null ? "QUOTA_EXCEEDED" : "ANALYZED",
    confidenceScore: score,
    documentAuthenticityScore: 100,
    paymentMatchScore: 100,
    riskLevel,
    signals: [],
    comparison,
    modelVersion: "test",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const PASS_ROW = (key: string, value: unknown) => ({
  key,
  expected: value,
  received: value,
  status: "PASS",
  note: null,
});

/** Confidence scenario. Register AFTER mockOrdersDashboard. */
async function mockConfidenceScenario(
  page: Page,
  orders: Array<Record<string, unknown>>,
  verification?: unknown
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.endsWith("/auth/me/permissions")) return json(["order.view", "order.create"]);
    if (path.endsWith("/orders/conf1/payment-proof")) {
      return json({
        receivedAt: new Date().toISOString(),
        proofType: "image",
        media: PROOF_MEDIA,
        proofs: [{ receivedAt: new Date().toISOString(), proofType: "image", media: PROOF_MEDIA }],
      });
    }
    if (path.endsWith("/orders/conf1/payment-verification") && verification !== undefined) {
      return json(verification);
    }
    if (path.endsWith("/orders/conf1/history")) return json([]);
    if (path.endsWith("/orders/conf1")) {
      return json(orders.find((o) => o["id"] === "conf1") ?? {});
    }
    if (path.endsWith("/orders") && !url.searchParams.get("status")) {
      return json(orders);
    }
    await route.fallback();
  });
}

test.describe("Orders — calificación de confianza", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await blockUnmockedApiCalls(page);
    await blockRealtimeSockets(page);
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
    await mockBoardPermissions(page);
    await mockRefreshSuccess(page);
  });

  test("riesgo medio: ícono en ámbar y tooltip con el nivel y el puntaje", async ({
    page,
  }) => {
    await mockConfidenceScenario(page, [
      proofOrder("conf1", 105, { analysisStatus: "ANALYZED", riskLevel: "MEDIUM", confidenceScore: 55 }),
    ]);
    await openBoard(page);

    const label = "Comprobante: Confianza media (55/100). Clic para verlo";
    const icon = page.getByRole("button", { name: label }).first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/amber/);

    await icon.hover();
    await expect(page.getByRole("tooltip")).toHaveText(label);
  });

  test("análisis pendiente: ícono en celeste que avisa que se está analizando", async ({
    page,
  }) => {
    await mockConfidenceScenario(page, [
      proofOrder("conf1", 105, { analysisStatus: "PENDING", riskLevel: "UNKNOWN", confidenceScore: null }),
    ]);
    await openBoard(page);

    const icon = page
      .getByRole("button", { name: "Comprobante: analizando la confianza… Clic para verlo" })
      .first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/sky/);
  });

  test("sin verificación: ícono neutro con el tooltip genérico", async ({ page }) => {
    await mockConfidenceScenario(page, [proofOrder("conf1", 105)]);
    await openBoard(page);

    const icon = page
      .getByRole("button", { name: "Ver el comprobante de pago" })
      .first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/sky/);
  });

  test("visor con discrepancia: encabezado bajo y conteo de no-coincidencias", async ({
    page,
  }) => {
    await mockConfidenceScenario(
      page,
      [proofOrder("conf1", 105, { analysisStatus: "ANALYZED", riskLevel: "HIGH", confidenceScore: 35 })],
      verificationPayload(
        [
          { key: "amount", expected: 20000, received: 15000, status: "FAIL", note: "Monto distinto" },
          PASS_ROW("date", "2026-10-05"),
          PASS_ROW("sender", "Cliente E2E"),
          PASS_ROW("beneficiary", "Nequi 300 555 1020"),
          PASS_ROW("currency", "COP"),
        ],
        "HIGH",
        35
      )
    );
    await openBoard(page);

    // Open the viewer from the detail, like an operator would
    await page.getByText("#105", { exact: true }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: "Detalle del Pedido" })).toBeVisible();
    // Labeled variant shows the "Comprobante" badge; its aria-label carries
    // the confidence level, so match the visible badge text instead
    await drawer.getByRole("button", { name: "Comprobante" }).click();

    const viewer = page.getByTestId("payment-proof-viewer");
    await expect(viewer.getByRole("heading", { name: "Comprobante de pago" })).toBeVisible();
    await expect(viewer.getByText("Confianza baja")).toBeVisible();
    await expect(viewer.getByText("1 no coincide")).toBeVisible();
    await expect(viewer.getByText("Monto distinto")).toBeVisible();
  });
});
