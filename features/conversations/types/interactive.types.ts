/**
 * Interactive Preview Types
 *
 * `ConversationMessage.interactive` es `unknown` en el wire porque la
 * columna guarda dos formas incompatibles según `direction` (ver
 * `buildInteractivePreview` en `utils/interactive-preview.ts`): el payload
 * abstracto propio para OUTBOUND, el objeto crudo del webhook de Meta para
 * INBOUND. `InteractivePreview` es el modelo normalizado que el bubble
 * realmente renderiza — discriminado por `kind`, ya resuelto a texto
 * legible, independiente de cuál de las dos formas lo originó.
 */

export interface InteractivePreviewButtons {
  kind: "buttons";
  body?: string;
  footer?: string;
  buttons: string[];
}

export interface InteractivePreviewListRow {
  title: string;
  description?: string;
}

export interface InteractivePreviewListSection {
  title?: string;
  rows: InteractivePreviewListRow[];
}

export interface InteractivePreviewList {
  kind: "list";
  body?: string;
  footer?: string;
  buttonText: string;
  sections: InteractivePreviewListSection[];
}

export interface InteractivePreviewCta {
  kind: "cta";
  header?: string;
  body?: string;
  footer?: string;
  buttonText: string;
  url: string;
}

export interface InteractivePreviewCarouselCard {
  title?: string;
  description?: string;
  imageUrl?: string;
  buttons: string[];
}

export interface InteractivePreviewCarousel {
  kind: "carousel";
  body?: string;
  cards: InteractivePreviewCarouselCard[];
}

export interface InteractivePreviewProductCarousel {
  kind: "productCarousel";
  header?: string;
  body?: string;
  footer?: string;
  productCount: number;
}

export interface InteractivePreviewLocationRequest {
  kind: "locationRequest";
  name?: string;
  address?: string;
  buttonText?: string;
}

export interface InteractivePreviewLocation {
  kind: "location";
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface InteractivePreviewTemplate {
  kind: "template";
  templateName: string;
  languageCode?: string;
  params: string[];
}

export interface InteractivePreviewContact {
  name: string;
  phones: string[];
}

export interface InteractivePreviewContacts {
  kind: "contacts";
  contacts: InteractivePreviewContact[];
}

export interface InteractivePreviewReaction {
  kind: "reaction";
  emoji: string | null;
}

/** Respuesta del cliente a un botón/fila, ya resuelta al label legible. */
export interface InteractivePreviewReply {
  kind: "reply";
  label: string;
}

export type InteractivePreview =
  | InteractivePreviewButtons
  | InteractivePreviewList
  | InteractivePreviewCta
  | InteractivePreviewCarousel
  | InteractivePreviewProductCarousel
  | InteractivePreviewLocationRequest
  | InteractivePreviewLocation
  | InteractivePreviewTemplate
  | InteractivePreviewContacts
  | InteractivePreviewReaction
  | InteractivePreviewReply;
