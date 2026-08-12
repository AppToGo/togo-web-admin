import { test, expect } from "playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { mockLoginSuccess } from "../helpers/mock-api";
import { mockOrdersDashboard } from "../helpers/mock-orders-api";

/**
 * Regression test for docs/architecture/pedidos-en-mesa.md, Fase 1.
 *
 * Antes del fix, `OrdersKanbanBoard`'s delivery-type filter clasificaba
 * cualquier pedido sin `addressId` como "pickup" —
 * `order.deliveryType ? order.deliveryType === "DELIVERY" : !!order.addressId`
 * no distinguía PICKUP de DINE_IN, así que un pedido de mesa quedaba
 * atrapado bajo el switch "Recoger en tienda" y no había forma de
 * mostrarlo/ocultarlo de forma independiente. Este test prueba que las 3
 * modalidades se filtran de forma verdaderamente independiente.
 */
test.describe("Orders — filtro de tipo de entrega (dine-in)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Registrar el mock de login PRIMERO — mockOrdersDashboard() intercepta
    // **/v1/** en bloque y hace fallback() a este handler para lo que no
    // reconoce (Playwright ejecuta el route registrado más recientemente
    // primero).
    await mockLoginSuccess(page);
    await mockOrdersDashboard(page);
  });

  test("dineIn y pickup se filtran de forma independiente", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("test@togo.com", "any-password");
    await loginPage.submit();
    await loginPage.waitForDashboardRedirect();

    const dineInOrder = page.getByText("#DINEIN", { exact: true });
    const pickupOrder = page.getByText("#PICKUP", { exact: true });

    // Estado inicial: los 3 pedidos (delivery/pickup/dine-in) visibles.
    // Sirve además de punto de sincronización: recién acá el Kanban terminó
    // de hidratar con datos, que es cuando el tour de onboarding se monta.
    await expect(dineInOrder).toBeVisible();
    await expect(pickupOrder).toBeVisible();

    // El tour de onboarding (spotlight a pantalla completa, 8 pasos) se
    // dispara en la primera visita al dashboard con datos ya cargados — sin
    // descartarlo, su overlay tapa el botón de filtros y cualquier click ahí
    // termina interceptado por un <div> del spotlight en vez del botón real.
    await page
      .getByRole("button", { name: /saltar tour/i })
      .click({ timeout: 5_000 })
      .catch(() => undefined);

    // El toast de bienvenida ("¡Bienvenido! Inicio de sesión exitoso") queda
    // flotando sobre el botón de filtros y le intercepta los clicks — esperar
    // a que desaparezca antes de interactuar con la toolbar.
    await page
      .getByText("¡Bienvenido! Inicio de sesión exitoso")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => undefined);

    // Modal de upsell de plan ("Mejorá tu plan") — se dispara solo, sin red
    // mockeada para /plans, así que siempre cae en su estado de error.
    // "Continuar con plan gratuito" lo cierra por la vía semántica correcta
    // en vez de forzar un cierre con Escape.
    await page
      .getByText("Continuar con plan gratuito")
      .click({ timeout: 5_000 })
      .catch(() => undefined);

    // Abrir el popover de filtros.
    await page.locator('[data-tour-step="filters"]').click();

    const dineInSwitch = page
      .locator("label", { hasText: "En mesa" })
      .getByRole("switch");
    const pickupSwitch = page
      .locator("label", { hasText: "Recoger en tienda" })
      .getByRole("switch");

    await expect(dineInSwitch).toBeVisible();

    // Apagar "En mesa": el pedido DINE_IN desaparece, PICKUP se mantiene.
    // Este es el caso exacto que el bug rompía — antes de la Fase 1, un
    // DINE_IN sin `deliveryType` explícito (o clasificado por el fallback
    // de `addressId`) se ocultaba/mostraba junto con PICKUP, nunca solo.
    await dineInSwitch.click();
    await expect(dineInOrder).toHaveCount(0);
    await expect(pickupOrder).toBeVisible();

    // Reactivar "En mesa" y apagar "Recoger en tienda": el inverso debe
    // cumplirse también — PICKUP desaparece, DINE_IN se mantiene.
    await dineInSwitch.click();
    await expect(dineInOrder).toBeVisible();

    await pickupSwitch.click();
    await expect(pickupOrder).toHaveCount(0);
    await expect(dineInOrder).toBeVisible();
  });
});
