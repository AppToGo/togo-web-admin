import { type Page, type Request } from "playwright/test";

/**
 * Embudo del bot (plan bot natural, T20): respuesta de
 * `GET /businesses/:id/metrics/conversation-funnel` con la forma del DTO
 * del backend (`src/metrics/dto/conversation-funnel-response.dto.ts`).
 */
export const FAKE_CONVERSATION_FUNNEL = {
  businessId: "e2e-test-business-id",
  period: {
    from: "2026-09-01T05:00:00.000Z",
    to: "2026-09-27T04:59:59.999Z",
    timeZone: "America/Bogota",
  },
  turns: {
    totals: {
      turns: 10,
      invalidSelection: 2,
      unknown: 1,
      outOfStep: 0,
      promptTextMatched: 3,
      promptTextUnmatched: 1,
    },
    rates: {
      invalidSelection: 0.2,
      unknown: 0.1,
      outOfStep: 0,
      promptTextMatched: 0.75,
    },
    byState: [
      {
        state: "SEARCHING_PRODUCT",
        turns: 6,
        invalidSelection: 0,
        unknown: 1,
        outOfStep: 0,
        promptTextMatched: 0,
        promptTextUnmatched: 0,
      },
      {
        state: "COLLECTING_PAYMENT_METHOD",
        turns: 4,
        invalidSelection: 2,
        unknown: 0,
        outOfStep: 0,
        promptTextMatched: 3,
        promptTextUnmatched: 0,
      },
    ],
    byDay: [
      {
        date: "2026-09-25",
        turns: 4,
        invalidSelection: 1,
        unknown: 0,
        outOfStep: 0,
        promptTextMatched: 1,
        promptTextUnmatched: 0,
      },
      {
        date: "2026-09-26",
        turns: 6,
        invalidSelection: 1,
        unknown: 1,
        outOfStep: 0,
        promptTextMatched: 2,
        promptTextUnmatched: 1,
      },
    ],
  },
  sessions: {
    total: 7,
    byOutcome: { ORDER_PLACED: 2, ABANDONED: 2, SUPPORT: 1, UNSET: 1, OPEN: 1 },
    abandonedByState: [{ state: "COLLECTING_PAYMENT_METHOD", sessions: 2 }],
    handoffRequested: 1,
    rates: { order: 0.3333, abandoned: 0.3333, handoff: 0.1429 },
  },
  messagesToOrder: { orders: 2, average: 4, median: 4, p90: 4.8 },
  paraphrase: {
    requested: 8,
    applied: 3,
    rejected: 3,
    failed: 2,
    rates: { applied: 0.375 },
    rejectedByReason: [
      { reason: "bold", count: 2 },
      { reason: "numbers", count: 1 },
    ],
    failedByCause: [{ cause: "timeout", count: 2 }],
  },
};

/**
 * Mockea permisos y el embudo. Llamar DESPUÉS de `mockOrdersDashboard()`:
 * lo que no reconoce cae en ese handler (`route.fallback()`).
 *
 * @param permissions - Lo que devuelve `GET /auth/me/permissions`.
 * @param onFunnelRequest - Para inspeccionar la query del embudo.
 */
export async function mockConversationFunnel(
  page: Page,
  options: {
    permissions: string[];
    onFunnelRequest?: (request: Request) => void;
  }
): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/auth/me/permissions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.permissions),
      });
    }

    if (url.pathname.endsWith("/metrics/conversation-funnel")) {
      options.onFunnelRequest?.(route.request());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_CONVERSATION_FUNNEL),
      });
    }

    await route.fallback();
  });
}
