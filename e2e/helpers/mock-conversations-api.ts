import { type Page } from "playwright/test";

/**
 * Network mocks for the Inbox and "Conversaciones sin pedido" screens
 * (E2E). One `page.route()` for `/businesses/:id/conversations…`;
 * everything else falls back to the other mocks. Register AFTER the
 * generic `/v1/**` mocks (last matching route wins).
 */

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

export function session(
  id: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id,
    status: "OPEN",
    outcome: null,
    channel: "WHATSAPP",
    startedAt: minutesAgo(40),
    lastMessageAt: minutesAgo(2),
    closedAt: null,
    messageCount: 5,
    phoneNumber: "+573001112233",
    customer: { id: `cust-${id}`, name: "Camila Torres", phoneNumber: "+573001112233" },
    orderIds: [],
    control: "PENDING_HUMAN",
    assignedUserId: null,
    assignedTo: null,
    assignedAt: null,
    controlChangedAt: minutesAgo(5),
    unreadCount: 2,
    lastCustomerMessageAt: minutesAgo(2),
    windowExpiresAt: new Date(now + 20 * 3_600_000).toISOString(),
    ...overrides,
  };
}

export const INBOX_SESSIONS = [
  session("sess-a"),
  session("sess-b", {
    customer: { id: "cust-b", name: "Julián Mora", phoneNumber: "+573014567788" },
    phoneNumber: "+573014567788",
    control: "HUMAN",
    assignedUserId: "e2e-test-user-id",
    assignedTo: { id: "e2e-test-user-id", name: "Test User" },
    unreadCount: 0,
  }),
];

export const WITHOUT_ORDER_SESSIONS = [
  session("sess-c", {
    status: "CLOSED",
    outcome: "ABANDONED",
    closedAt: minutesAgo(30),
    customer: { id: "cust-c", name: "Sofía León", phoneNumber: "+573209998877" },
    control: "BOT",
    unreadCount: 0,
    messageCount: 14,
  }),
  session("sess-d", {
    status: "CLOSED",
    outcome: "SUPPORT",
    closedAt: minutesAgo(90),
    customer: { id: "cust-d", name: "Andrés Peña", phoneNumber: "+573151112222" },
    control: "BOT",
    unreadCount: 0,
    messageCount: 9,
  }),
];

function message(
  id: string,
  senderType: "CUSTOMER" | "BOT" | "OPERATOR" | "SYSTEM",
  text: string,
  minutes: number
) {
  return {
    id,
    sessionId: "sess-a",
    direction: senderType === "CUSTOMER" ? "INBOUND" : "OUTBOUND",
    senderType,
    senderUserId: null,
    operatorSource: null,
    contentType: "TEXT",
    text,
    media: null,
    interactive: null,
    waMessageId: null,
    replyToWaMessageId: null,
    relayOfMessageId: null,
    status: senderType === "CUSTOMER" ? "DELIVERED" : "READ",
    statusUpdatedAt: null,
    errorCode: null,
    intent: null,
    confidence: null,
    fsmState: null,
    providerTimestamp: null,
    createdAt: minutesAgo(minutes),
  };
}

/** Detalle de una sesión del mock (para variantes en un spec). */
export function conversationDetail(id: string) {
  const base =
    [...INBOX_SESSIONS, ...WITHOUT_ORDER_SESSIONS].find((s) => s.id === id) ??
    INBOX_SESSIONS[0];
  return {
    ...base,
    messagesTruncated: false,
    events: [],
    messages: [
      message("m1", "BOT", "¡Hola! ¿Qué te gustaría pedir hoy?", 12),
      message("m2", "CUSTOMER", "Quiero hacer un pedido grande para mañana", 10),
      message("m3", "BOT", "Te comunico con un asesor.", 9),
      message("m4", "CUSTOMER", "¿Me pueden ayudar con un pedido para mañana?", 2),
    ],
  };
}

export async function mockConversationsApi(page: Page): Promise<void> {
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/conversations(\/[^/]+)?(\/.*)?$/);
    if (!match || url.pathname.includes("/orders/")) return route.fallback();
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    const id = match[1]?.slice(1);
    if (!id) {
      const list =
        url.searchParams.get("withoutOrder") === "true" || url.searchParams.get("outcome")
          ? WITHOUT_ORDER_SESSIONS
          : INBOX_SESSIONS;
      return json({
        data: list,
        meta: {
          page: 1,
          limit: 20,
          total: list.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }
    if (id === "summary") {
      return json({
        bot: 3,
        pendingHuman: 1,
        human: 1,
        mine: 1,
        unassigned: 1,
        unreadInHandoff: 2,
        needsAttention: 1,
      });
    }
    if (id === "assignable-users") return json([{ id: "op-1", name: "Operadora E2E" }]);
    if (route.request().method() === "POST") return json({ ok: true });
    return json(conversationDetail(id));
  });
}
