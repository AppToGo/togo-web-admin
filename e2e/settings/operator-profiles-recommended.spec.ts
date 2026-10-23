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
 * Perfiles recomendados por ToGo: al registrarse, el negocio recibe los
 * perfiles más comunes de su industria (sourceTemplateKey != null). En la
 * lista se distinguen con la etiqueta "Recomendado por ToGo" y muestran su
 * descripción; los creados por el dueño no llevan etiqueta.
 */

const PERMISSIONS = [
  "order.view",
  "order.create",
  "profile.view",
  "profile.create",
  "profile.update",
  "profile.delete",
];

const now = new Date().toISOString();

function profile(
  id: string,
  name: string,
  sourceTemplateKey: string | null,
  description: string | null,
) {
  return {
    id,
    name,
    description,
    sourceTemplateKey,
    businessId: "e2e-test-business-id",
    permissions: [{ id: `${id}-p1`, permissionCode: "order.view" }],
    createdAt: now,
    updatedAt: now,
  };
}

const PROFILES = [
  profile("prof-cajero", "CAJERO", "cashier", "Cobra en caja y registra pagos."),
  profile("prof-propio", "TURNO NOCHE", null, null),
];

/** Cuerpos de los PUT al perfil, para verificar lo que se envía. */
const profileUpdates: unknown[] = [];

async function mockProfiles(page: Page): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/operator-profiles/catalog/permissions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    if (path.endsWith("/operator-profiles/prof-cajero")) {
      if (request.method() === "PUT") {
        const body = request.postDataJSON() as Record<string, unknown>;
        profileUpdates.push(body);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...PROFILES[0], ...body }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(PROFILES[0]),
      });
    }
    if (path.endsWith("/operator-profiles")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(PROFILES),
      });
    }
    return route.fallback();
  });
}

async function login(page: Page) {
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
  await mockProfiles(page);
  await mockBoardPermissions(page, PERMISSIONS);
  await openBoard(page);
}

test.describe("Perfiles recomendados por ToGo", () => {
  test("marca los perfiles de plantilla y muestra su descripción", async ({ page }) => {
    await login(page);
    await page.goto("/es/dashboard/settings/operator-profiles");

    const recommended = page.locator(".group", { hasText: "CAJERO" }).first();
    await expect(recommended.getByText("Recomendado por ToGo")).toBeVisible();
    await expect(recommended.getByText("Cobra en caja y registra pagos.")).toBeVisible();

    const own = page.locator(".group", { hasText: "TURNO NOCHE" }).first();
    await expect(own).toBeVisible();
    await expect(own.getByText("Recomendado por ToGo")).toHaveCount(0);
  });

  test("la descripción de un perfil se edita y se envía en el PUT", async ({ page }) => {
    profileUpdates.length = 0;
    await login(page);
    await page.goto("/es/dashboard/settings/operator-profiles/prof-cajero");

    const description = page.getByLabel("Descripción");
    await expect(description).toHaveValue("Cobra en caja y registra pagos.");
    await description.fill("Cobra en caja, registra pagos y cierra el turno.");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect.poll(() => profileUpdates.length).toBe(1);
    expect(profileUpdates[0]).toMatchObject({
      name: "CAJERO",
      description: "Cobra en caja, registra pagos y cierra el turno.",
    });
  });
});
