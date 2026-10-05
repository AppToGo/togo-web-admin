/**
 * Mensajes del asistente (plan bot natural, T22).
 * Espejo de `api-togo/src/bot-messages/bot-messages.service.ts`.
 */

export type BotMessageStage =
  | "saludo"
  | "busqueda"
  | "carrito"
  | "entrega"
  | "pago"
  | "confirmacion"
  | "estado"
  | "ayuda";

/** Quién escribió las versiones que se muestran. */
export type BotMessageOrigin = "TEMPLATE" | "MANUAL" | "AI" | "AI_EDITED";

export interface BotMessageVersionSet {
  variants: string[];
  origin: BotMessageOrigin;
}

export type BotMessageIssueCode =
  | "empty"
  | "too_long"
  | "missing_variable"
  | "unknown_variable"
  | "url"
  | "duplicate"
  | "address"
  | "emojis";

export interface BotMessageIssue {
  index: number;
  code: BotMessageIssueCode;
  severity: "error" | "warning";
  variable?: string;
}

export interface BotMessage {
  id: string;
  stage: BotMessageStage;
  purpose: string;
  maxLength: number;
  required: string[];
  allowed: string[];
  templateVariants: string[];
  published: BotMessageVersionSet;
  draft: BotMessageVersionSet | null;
  issues: BotMessageIssue[];
}

export type BotMessageRunStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

export interface BotMessageRun {
  id: string;
  status: BotMessageRunStatus;
  total: number;
  done: number;
  failedIds: string[];
  createdAt: string;
}

export interface BotMessagesCatalog {
  version: number;
  hasDraft: boolean;
  voice: { address: "tu" | "usted"; emojis: boolean; styleNotes?: string };
  aiAvailable: boolean;
  generationsLeftToday: number;
  stages: { stage: BotMessageStage; messages: BotMessage[] }[];
  latestRun: BotMessageRun | null;
}

export interface GenerateBotMessagesRequest {
  examples: { templateId: string; text: string }[];
  styleNotes?: string;
  keepManual: boolean;
}
