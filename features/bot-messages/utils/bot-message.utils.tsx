/**
 * Mensajes del asistente (plan bot natural, T22): validación en vivo y vista
 * previa. La validación es un espejo de
 * `api-togo/src/conversation/bot-messages/bot-message-validator.ts` para
 * avisar mientras se escribe; la API es la que decide al guardar.
 */

import type { ReactNode } from "react";
import type {
  BotMessage,
  BotMessageIssue,
  BotMessagesCatalog,
} from "../types/bot-messages.types";

const VARIABLE = /\{(\w+)\}/g;
// Espejo de `api-togo/src/conversation/paraphrase/paraphrase-validator.ts`
// (URL_OR_DOMAIN, TUTEO, EMOJI): si la API amplía esas listas, hay que
// traer el cambio acá o el editor dirá "válido" y guardar devolverá 400.
const URL_OR_DOMAIN =
  /(https?:\/\/|www\.)|\b[\w-]+\.(com|co|net|org|app|io|me|ly|shop|store|ai|dev|online|biz|info|site|page|link|xyz|tech|blog)\b/i;
const TUTEO =
  /(?<![\p{L}])(te|ti|tu|tus|contigo|quieres|puedes|tienes|prefieres|escríbeme|dime|elige|toca|escribe)(?![\p{L}])/iu;
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Mínimo de versiones recomendado (la IA siempre entrega al menos esto). */
export const RECOMMENDED_VARIANTS = 3;
export const MAX_VARIANTS = 8;

export function variablesIn(text: string): string[] {
  return [...new Set([...text.matchAll(VARIABLE)].map(([, name]) => name))];
}

const normalize = (text: string) =>
  text.trim().replace(/\s+/g, " ").toLowerCase();

export function validateVariants(
  variants: string[],
  message: Pick<BotMessage, "maxLength" | "required" | "allowed">,
  voice?: BotMessagesCatalog["voice"]
): BotMessageIssue[] {
  const issues: BotMessageIssue[] = [];
  const seen = new Set<string>();
  variants.forEach((raw, index) => {
    const text = raw.trim();
    if (!text) {
      issues.push({ index, code: "empty", severity: "error" });
      return;
    }
    if (text.length > message.maxLength) {
      issues.push({ index, code: "too_long", severity: "error" });
    }
    const used = variablesIn(text);
    for (const variable of message.required) {
      if (!used.includes(variable)) {
        issues.push({
          index,
          code: "missing_variable",
          severity: "error",
          variable,
        });
      }
    }
    for (const variable of used) {
      if (!message.allowed.includes(variable)) {
        issues.push({
          index,
          code: "unknown_variable",
          severity: "error",
          variable,
        });
      }
    }
    if (URL_OR_DOMAIN.test(text)) {
      issues.push({ index, code: "url", severity: "error" });
    }
    if (voice?.address === "usted" && TUTEO.test(text)) {
      issues.push({ index, code: "address", severity: "warning" });
    }
    if (voice?.emojis === false && EMOJI.test(text)) {
      issues.push({ index, code: "emojis", severity: "warning" });
    }
    const key = normalize(text);
    if (seen.has(key)) {
      issues.push({ index, code: "duplicate", severity: "error" });
    }
    seen.add(key);
  });
  return issues;
}

export const hasErrors = (issues: BotMessageIssue[]) =>
  issues.some((issue) => issue.severity === "error");

/** Valores de ejemplo para la vista previa (datos ficticios). */
const SAMPLE_VALUES: Record<string, string> = {
  businessName: "Tu negocio",
  assistantName: "Sofía",
  customerFirstName: "Laura",
  customerName: "Laura",
  contactName: "Laura",
  timeGreeting: "Buenas tardes",
  productName: "Hamburguesa clásica",
  price: "$22.000",
  quantity: "2",
  total: "$44.000",
  cartItems: "2x Hamburguesa clásica — $44.000",
  descriptionLine: "",
  orderId: "1024",
  orderNumber: "1024",
  address: "Calle 10 # 43-20",
  addressText: "Calle 10 # 43-20",
  method: "Nequi",
  fee: "$5.000",
  maxKm: "8",
  close: "10:00 p. m.",
  next: "mañana a las 11:00 a. m.",
  query: "hamburguesa",
  orderRef: " (pedido #1024)",
};

export function withSampleValues(text: string): string {
  return text
    .replace(VARIABLE, (match, name: string) => SAMPLE_VALUES[name] ?? match)
    .replace(/\n{3,}/g, "\n\n");
}

/** `*negrita*` de WhatsApp, como se ve en el chat. */
export function withWhatsAppBold(text: string): ReactNode[] {
  return text
    .split(/(\*[^*\n]+\*)/g)
    .map((part, i) =>
      /^\*[^*\n]+\*$/.test(part) ? (
        <strong key={i}>{part.slice(1, -1)}</strong>
      ) : (
        part
      )
    );
}

/** Lo que se muestra de un mensaje: el borrador si hay, si no lo publicado. */
export const shownVersions = (message: BotMessage) =>
  message.draft ?? message.published;
