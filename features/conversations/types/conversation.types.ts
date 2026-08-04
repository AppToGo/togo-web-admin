/**
 * Conversations Feature Types
 *
 * Refleja a mano los DTOs de `src/conversation-history/dto/*` del backend
 * (Fase B) — no hay codegen de tipos en este repo, se escriben por feature
 * (mismo criterio que `features/customers/types`).
 */

export type ConversationStatus = "OPEN" | "CLOSED" | "EXPIRED";

export type ConversationOutcome =
  | "ORDER_PLACED"
  | "ABANDONED"
  | "SUPPORT"
  | "NO_INTENT"
  | "SPAM";

export type ConversationChannel = "WHATSAPP" | "WEB";

/** Fase C — handoff humano. BOT (default) | PENDING_HUMAN (esperando que alguien tome) | HUMAN (un operador la tiene). */
export type ConversationControl = "BOT" | "PENDING_HUMAN" | "HUMAN";

export type ConversationEventType =
  | "HANDOFF_REQUESTED"
  | "HANDOFF_TAKEN"
  | "HANDOFF_RELEASED"
  | "HANDOFF_TIMED_OUT"
  | "HANDOFF_WAIT_EXPIRED"
  | "BOT_PAUSED"
  | "BOT_RESUMED"
  | "SESSION_CLOSED"
  | "SESSION_REOPENED"
  | "NOTE_ADDED"
  | "ASSIGNED"
  | "UNASSIGNED";

export type MessageDirection = "INBOUND" | "OUTBOUND";

export type MessageSenderType = "CUSTOMER" | "BOT" | "OPERATOR" | "SYSTEM";

export type MessageContentType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "DOCUMENT"
  | "LOCATION"
  | "INTERACTIVE"
  | "TEMPLATE"
  | "SYSTEM_NOTE"
  | "STICKER"
  | "CONTACTS"
  | "REACTION"
  | "CTA_URL";

export type MessageDeliveryStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export type OperatorSource = "INBOX" | "WHATSAPP_RELAY";

/** Ver `MediaRefResolver` (backend) — clasificación de `mediaKey` antes de firmar. */
export type MediaRefKind =
  | "STORAGE_KEY"
  | "EXTERNAL_URL"
  | "WHATSAPP_MEDIA_ID"
  | "UNKNOWN";

export type MediaUnavailableReason =
  | "WHATSAPP_MEDIA_NOT_ARCHIVED"
  | "UNRECOGNIZED_REF"
  | "PRESIGN_FAILED";

export interface ResolvedMedia {
  kind: MediaRefKind;
  url: string | null;
  mimeType: string | null;
  filename: string | null;
  unavailableReason?: MediaUnavailableReason;
}

export interface ConversationMessage {
  id: string;
  sessionId: string;
  direction: MessageDirection;
  senderType: MessageSenderType;
  senderUserId: string | null;
  operatorSource: OperatorSource | null;
  contentType: MessageContentType;
  text: string | null;
  media: ResolvedMedia | null;
  interactive: unknown | null;
  waMessageId: string | null;
  replyToWaMessageId: string | null;
  relayOfMessageId: string | null;
  status: MessageDeliveryStatus;
  statusUpdatedAt: string | null;
  errorCode: string | null;
  intent: string | null;
  confidence: number | null;
  fsmState: string | null;
  providerTimestamp: string | null;
  createdAt: string;
}

export interface ConversationCustomerSummary {
  id: string;
  name: string | null;
  phoneNumber: string;
}

export interface ConversationAssignee {
  id: string;
  name: string | null;
}

/** `GET /businesses/:businessId/conversations/assignable-users` — dialog de asignación. */
export interface AssignableUser {
  id: string;
  name: string;
}

/** Campos compartidos entre el item de lista y el detalle. */
export interface ConversationSessionSummary {
  id: string;
  status: ConversationStatus;
  outcome: ConversationOutcome | null;
  channel: ConversationChannel;
  startedAt: string;
  lastMessageAt: string;
  closedAt: string | null;
  messageCount: number;
  phoneNumber: string;
  customer: ConversationCustomerSummary | null;
  orderIds: string[];
  // ─── Fase C (inbox / handoff) ────────────────────────────────────────
  control: ConversationControl;
  assignedUserId: string | null;
  assignedTo: ConversationAssignee | null;
  assignedAt: string | null;
  controlChangedAt: string | null;
  unreadCount: number;
  lastCustomerMessageAt: string | null;
  windowExpiresAt: string | null;
}

export type ConversationListItem = ConversationSessionSummary;

export interface ConversationEventActor {
  id: string;
  name: string | null;
}

export interface ConversationEvent {
  id: string;
  type: ConversationEventType;
  actorUserId: string | null;
  actor: ConversationEventActor | null;
  payload: unknown;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSessionSummary {
  messages: ConversationMessage[];
  messagesTruncated: boolean;
  events: ConversationEvent[];
}

/** `GET /businesses/:businessId/conversations/summary` — badges de pestañas del inbox. */
export interface ConversationSummary {
  bot: number;
  pendingHuman: number;
  human: number;
  mine: number;
  unassigned: number;
  unreadInHandoff: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Forma `{data, meta}` — igual que `PaginatedCustomersResponse`, NO la
 * aplanada legacy de `orders` (`{orders, total, page, totalPages, hasMore}`).
 */
export interface PaginatedConversationsResponse {
  data: ConversationListItem[];
  meta: PaginationMeta;
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  /** CSV en el wire; acá se maneja como array y se serializa en el service. */
  outcome?: ConversationOutcome[];
  /** Mutuamente excluyente con `outcome` (400 del backend si se combinan). */
  withoutOrder?: boolean;
  // ─── Fase C (inbox) ──────────────────────────────────────────────────
  /** CSV en el wire. */
  control?: ConversationControl[];
  /** CSV en el wire. Mutuamente excluyente con `withoutOrder`. */
  status?: ConversationStatus[];
  /** "me" | "unassigned" | un userId concreto. */
  assignedTo?: string;
  hasUnread?: boolean;
  /** Búsqueda por nombre de cliente o teléfono. */
  q?: string;
}
