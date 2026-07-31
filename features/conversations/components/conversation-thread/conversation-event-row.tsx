"use client";

import { useTranslations } from "next-intl";
import type { ConversationEvent } from "../../types";

interface ConversationEventRowProps {
  event: ConversationEvent;
}

const EVENTS_WITH_ACTOR = new Set([
  "HANDOFF_TAKEN",
  "HANDOFF_RELEASED",
  "NOTE_ADDED",
  "ASSIGNED",
]);

export function ConversationEventRow({ event }: ConversationEventRowProps) {
  const t = useTranslations("inbox");
  const actorName = event.actor?.name ?? "";

  const label = EVENTS_WITH_ACTOR.has(event.type)
    ? t(`events.${event.type}`, { actor: actorName })
    : t(`events.${event.type}`);

  const noteText =
    event.type === "NOTE_ADDED" && event.payload && typeof event.payload === "object"
      ? (event.payload as { text?: string }).text
      : null;

  return (
    <div className="flex justify-center">
      <div className="max-w-[90%] rounded-full bg-slate-100 px-3 py-1 text-center text-xs text-slate-500">
        {label}
        {noteText && <span className="ml-1 italic text-slate-600">— {noteText}</span>}
      </div>
    </div>
  );
}
