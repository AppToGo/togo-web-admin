import { type Page } from "playwright/test";

/**
 * Configuración del negocio con la voz del asistente (T18) y el interruptor
 * de paráfrasis (T21). Llamar DESPUÉS de `mockOrdersDashboard()`: lo que no
 * reconoce cae en ese handler (`route.fallback()`).
 */
export async function mockBusinessSettings(
  page: Page,
  options: {
    paraphraseAvailable: boolean;
    botVoice?: Record<string, unknown>;
    /** Recibe el body de cada PATCH /businesses/:id. */
    onUpdate?: (body: Record<string, unknown>) => void;
  }
): Promise<void> {
  const business = {
    id: "e2e-test-business-id",
    name: "Test Business",
    slug: "test-business",
    isActive: true,
    phone: "+573001112233",
    catalogVisibility: "PUBLIC",
    catalogMode: "MANUAL",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {},
    botVoice: { address: "tu", emojis: true, ...options.botVoice },
  };

  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path.endsWith("/bot-voice/preview")) {
      return json({
        greeting: "¡Hola, Laura! 👋",
        productFound: "*Hamburguesa clásica* a $22.000. ¿Cuántas te mando?",
        addedToCart: "Listo ✅ 2x Hamburguesa clásica — $44.000",
        paraphraseAvailable: options.paraphraseAvailable,
      });
    }

    if (path.endsWith("/businesses/me")) return json(business);

    if (path.endsWith(`/businesses/${business.id}`)) {
      if (request.method() === "PATCH") {
        const body = request.postDataJSON() as Record<string, unknown>;
        options.onUpdate?.(body);
        Object.assign(business, body);
        return json(business);
      }
      return json(business);
    }

    await route.fallback();
  });
}
