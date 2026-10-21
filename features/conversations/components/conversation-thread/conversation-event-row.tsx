"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ConversationEvent } from "../../types";

interface ConversationEventRowProps {
  event: ConversationEvent;
}

const EVENTS_WITH_ACTOR = new Set([
  "HANDOFF_TAKEN",
  "HANDOFF_RELEASED",
  "NOTE_ADDED",
  "ASSIGNED",
  // RELAY_STARTED siempre trae operatorUserId (ver
  // RelayLifecycleService.start en api-togo) — a diferencia de
  // RELAY_ENDED, cuyo actor puede venir null según el camino que lo
  // dispare, así que ese no entra acá.
  "RELAY_STARTED",
]);

/** Eventos que piden acción o contexto del equipo: van resaltados en ámbar. */
const HIGHLIGHTED_EVENTS = new Set(["HANDOFF_REQUESTED", "NOTE_ADDED"]);

export function ConversationEventRow({ event }: ConversationEventRowProps) {
  const t = useTranslations("inbox");
  const actorName = event.actor?.name ?? "";

  if (event.type === "BOT_DRAFT") {
    const draft =
      event.payload && typeof event.payload === "object"
        ? (event.payload as { text?: string; reason?: string })
        : null;
    // next-intl no lanza ante una clave faltante (devuelve la ruta): un
    // motivo nuevo del backend sin traducir se muestra tal cual.
    const reasonKey = `events.BOT_DRAFT_REASON_${draft?.reason}`;
    const reasonLabel = draft?.reason
      ? t.has(reasonKey)
        ? t(reasonKey)
        : draft.reason
      : null;
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl border border-dashed border-violet-300 bg-violet-50 px-3 py-2 text-xs text-slate-700">
          <p className="font-medium text-violet-700">
            {t("events.BOT_DRAFT")}
            {reasonLabel && <span className="font-normal"> · {reasonLabel}</span>}
          </p>
          {draft?.text && <p className="mt-0.5 italic">“{draft.text}”</p>}
        </div>
      </div>
    );
  }

  const label = EVENTS_WITH_ACTOR.has(event.type)
    ? t(`events.${event.type}`, { actor: actorName })
    : t(`events.${event.type}`);

  const noteText =
    event.type === "NOTE_ADDED" && event.payload && typeof event.payload === "object"
      ? (event.payload as { text?: string }).text
      : null;

  return (
    <div className="flex justify-center">
      <div
        className={cn(
          "max-w-[90%] rounded-full px-3 py-1 text-center text-xs",
          HIGHLIGHTED_EVENTS.has(event.type)
            ? "bg-amber-100/85 font-medium text-amber-800"
            : "bg-white/70 text-slate-600"
        )}
      >
        {label}
        {noteText && <span className="ml-1 font-normal italic">— {noteText}</span>}
      </div>
    </div>
  );
}
