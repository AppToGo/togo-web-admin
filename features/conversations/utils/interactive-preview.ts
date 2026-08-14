/**
 * Interactive Preview Builder
 *
 * `ConversationMessage.interactive` guarda dos formas incompatibles sin
 * discriminador propio, según `direction`:
 *  - OUTBOUND: el payload abstracto de mensajería (sin `type`/`timestamp`,
 *    ver `api-togo/src/whatsapp/messaging/interfaces/message-payload.interface.ts`)
 *    — `{ buttons: [{id,text}] }`, `{ sections: [{title, rows:[{id,title,description}]}] }`, etc.
 *  - INBOUND: el objeto crudo del webhook de Meta
 *    — `{ type, button_reply:{id,title} }`, `{ type, list_reply:{id,title,description} }`, etc.
 *
 * Esta función normaliza ambas formas a `InteractivePreview`, un modelo
 * único ya resuelto a texto legible que el bubble puede renderizar sin
 * saber de dónde vino. Es pura (sin React, sin i18n) y defensiva: el tipo
 * de entrada es `unknown` y hay histórico persistido con formas viejas —
 * cualquier cosa que no encaje devuelve `null` y el bubble cae al aviso
 * genérico de "no soportado" en vez de romper.
 */

import type { ConversationMessage } from "../types/conversation.types";
import type {
  InteractivePreview,
  InteractivePreviewListRow,
} from "../types/interactive.types";

const HANDLED_MEDIA_CONTENT_TYPES = new Set([
  "IMAGE",
  "AUDIO",
  "VIDEO",
  "DOCUMENT",
  "STICKER",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

// ─── INBOUND (webhook crudo de Meta) ──────────────────────────────────────

function buildInboundPreview(raw: Record<string, unknown>): InteractivePreview | null {
  // Respuesta a lista o a botones interactivos: { type, button_reply | list_reply: { id, title } }.
  const buttonReply = isRecord(raw.button_reply) ? raw.button_reply : undefined;
  const listReply = isRecord(raw.list_reply) ? raw.list_reply : undefined;
  const replyTitle = asString(buttonReply?.title) ?? asString(listReply?.title);
  if (replyTitle) {
    return { kind: "reply", label: replyTitle };
  }

  // Botón "quick reply" heredado (webhook tipo `button`): { payload, text }.
  const legacyButtonText = asString(raw.text);
  if (legacyButtonText && asString(raw.payload)) {
    return { kind: "reply", label: legacyButtonText };
  }

  // Ubicación entrante: { latitude, longitude, name?, address? }.
  const latitude = asNumber(raw.latitude);
  const longitude = asNumber(raw.longitude);
  if (latitude !== undefined && longitude !== undefined) {
    return {
      kind: "location",
      latitude,
      longitude,
      name: asString(raw.name),
      address: asString(raw.address),
    };
  }

  return null;
}

// ─── OUTBOUND (payload abstracto propio) ──────────────────────────────────

function buildOutboundButtons(raw: Record<string, unknown>): InteractivePreview | null {
  const buttons = asArray(raw.buttons);
  if (!buttons) return null;
  const labels = buttons
    .map((b) => (isRecord(b) ? asString(b.text) : undefined))
    .filter((t): t is string => Boolean(t));
  if (labels.length === 0) return null;
  return {
    kind: "buttons",
    body: asString(raw.body),
    footer: asString(raw.footer),
    buttons: labels,
  };
}

function buildOutboundList(raw: Record<string, unknown>): InteractivePreview | null {
  const rawSections = asArray(raw.sections);
  if (!rawSections) return null;
  const sections = rawSections
    .filter(isRecord)
    .map((section) => {
      const rows: InteractivePreviewListRow[] = (asArray(section.rows) ?? [])
        .filter(isRecord)
        .flatMap((row) => {
          const title = asString(row.title);
          return title ? [{ title, description: asString(row.description) }] : [];
        });
      return { title: asString(section.title), rows };
    })
    .filter((section) => section.rows.length > 0);
  if (sections.length === 0) return null;
  const buttonText = asString(raw.buttonText);
  if (!buttonText) return null;
  return {
    kind: "list",
    body: asString(raw.body),
    footer: asString(raw.footer),
    buttonText,
    sections,
  };
}

function buildOutboundCta(raw: Record<string, unknown>): InteractivePreview | null {
  const url = asString(raw.url);
  const buttonText = asString(raw.buttonText);
  if (!url || !buttonText) return null;
  return {
    kind: "cta",
    header: asString(raw.header),
    body: asString(raw.body),
    footer: asString(raw.footer),
    buttonText,
    url,
  };
}

function buildOutboundCarousel(raw: Record<string, unknown>): InteractivePreview | null {
  const rawCards = asArray(raw.cards);
  if (!rawCards) return null;
  const cards = rawCards.filter(isRecord).map((card) => ({
    title: asString(card.title),
    description: asString(card.description),
    imageUrl: asString(card.imageUrl),
    buttons: (asArray(card.buttons) ?? [])
      .map((b) => (isRecord(b) ? asString(b.text) : undefined))
      .filter((t): t is string => Boolean(t)),
  }));
  if (cards.length === 0) return null;
  return { kind: "carousel", body: asString(raw.body), cards };
}

function buildOutboundProductCarousel(raw: Record<string, unknown>): InteractivePreview | null {
  const products = asArray(raw.products);
  if (!products) return null;
  return {
    kind: "productCarousel",
    header: asString(raw.header),
    body: asString(raw.body),
    footer: asString(raw.footer),
    productCount: products.length,
  };
}

function buildOutboundTemplate(raw: Record<string, unknown>): InteractivePreview | null {
  const templateName = asString(raw.templateName);
  if (!templateName) return null;
  const components = asArray(raw.components) ?? [];
  const params = components
    .filter(isRecord)
    .flatMap((component) => asArray(component.parameters) ?? [])
    .filter(isRecord)
    .filter((param) => param.type === "text")
    .map((param) => asString(param.text))
    .filter((t): t is string => Boolean(t));
  return {
    kind: "template",
    templateName,
    languageCode: asString(raw.languageCode),
    params,
  };
}

function buildOutboundLocation(raw: Record<string, unknown>): InteractivePreview | null {
  const latitude = asNumber(raw.latitude);
  const longitude = asNumber(raw.longitude);
  if (latitude === undefined || longitude === undefined) return null;
  return {
    kind: "location",
    latitude,
    longitude,
    name: asString(raw.name),
    address: asString(raw.address),
  };
}

function buildOutboundContacts(raw: Record<string, unknown>): InteractivePreview | null {
  const rawContacts = asArray(raw.contacts);
  if (!rawContacts) return null;
  const contacts = rawContacts.filter(isRecord).map((contact) => {
    const firstName = asString(contact.firstName) ?? "";
    const lastName = asString(contact.lastName);
    const phones = (asArray(contact.phones) ?? [])
      .map((p) => (isRecord(p) ? asString(p.phone) : undefined))
      .filter((p): p is string => Boolean(p));
    return { name: [firstName, lastName].filter(Boolean).join(" "), phones };
  });
  if (contacts.length === 0) return null;
  return { kind: "contacts", contacts };
}

function buildOutboundReaction(raw: Record<string, unknown>): InteractivePreview | null {
  if (!("emoji" in raw)) return null;
  const emoji = raw.emoji;
  return { kind: "reaction", emoji: typeof emoji === "string" ? emoji : null };
}

function buildOutboundLocationRequest(raw: Record<string, unknown>): InteractivePreview | null {
  // `InteractiveProductPayload` (producto único, no carrusel) también cae en
  // contentType INTERACTIVE y no trae ninguna de las claves de las ramas
  // anteriores — sólo `catalogId`/`productRetailerId`. Hoy es código muerto
  // en el backend (nadie lo envía), pero si se activa no debe malinterpretarse
  // como una solicitud de ubicación vacía.
  if (asString(raw.catalogId) && asString(raw.productRetailerId)) return null;
  return {
    kind: "locationRequest",
    name: asString(raw.name),
    address: asString(raw.address),
    buttonText: asString(raw.buttonText),
  };
}

/**
 * Discrimina estructuralmente por presencia de claves — son mutuamente
 * excluyentes en los payloads reales (ver `MessagePayload` en el backend).
 * `locationRequest` va al final: es el payload OUTBOUND con
 * `contentType === "INTERACTIVE"` que no trae ninguna de las claves
 * anteriores (sólo `name?`/`address?`/`buttonText?`).
 */
function buildOutboundPreview(
  raw: Record<string, unknown>,
  contentType: ConversationMessage["contentType"]
): InteractivePreview | null {
  return (
    buildOutboundButtons(raw) ??
    buildOutboundList(raw) ??
    buildOutboundCarousel(raw) ??
    buildOutboundProductCarousel(raw) ??
    buildOutboundCta(raw) ??
    buildOutboundTemplate(raw) ??
    buildOutboundLocation(raw) ??
    buildOutboundContacts(raw) ??
    buildOutboundReaction(raw) ??
    (contentType === "INTERACTIVE" ? buildOutboundLocationRequest(raw) : null)
  );
}

export function buildInteractivePreview(
  message: ConversationMessage
): InteractivePreview | null {
  if (message.contentType === "TEXT") return null;
  if (HANDLED_MEDIA_CONTENT_TYPES.has(message.contentType)) return null;
  if (!isRecord(message.interactive)) return null;

  return message.direction === "INBOUND"
    ? buildInboundPreview(message.interactive)
    : buildOutboundPreview(message.interactive, message.contentType);
}
