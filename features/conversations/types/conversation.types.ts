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
}

export type ConversationListItem = ConversationSessionSummary;

export interface ConversationDetail extends ConversationSessionSummary {
  messages: ConversationMessage[];
  messagesTruncated: boolean;
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
}
