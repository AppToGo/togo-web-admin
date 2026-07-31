"use client";

import { forwardRef } from "react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./message-bubble";
import { ConversationEventRow } from "./conversation-event-row";
import type { ConversationDetail } from "../../types";

type ThreadItem =
  | { kind: "message"; createdAt: string; message: ConversationDetail["messages"][number] }
  | { kind: "event"; createdAt: string; event: ConversationDetail["events"][number] };

function buildThreadItems(data: ConversationDetail): ThreadItem[] {
  const items: ThreadItem[] = [
    ...data.messages.map((message): ThreadItem => ({
      kind: "message",
      createdAt: message.createdAt,
      message,
    })),
    ...(data.events ?? []).map((event): ThreadItem => ({
      kind: "event",
      createdAt: event.createdAt,
      event,
    })),
  ];
  return items.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

interface ConversationThreadViewProps {
  data: ConversationDetail | null | undefined;
  isLoading: boolean;
  className?: string;
  /** Default "max-h-[60vh]" (uso en diálogo). El inbox pasa "h-full" para ocupar el panel completo. */
  heightClassName?: string;
}

/**
 * Parte presentacional de `ConversationThread`, separada para que
 * `OrderDetailContent` pueda reusarla con los datos que ya trae
 * `useConversationByOrder` (que resuelve sesión + hilo en una sola
 * llamada) sin disparar un segundo fetch por `sessionId`.
 *
 * `ref` apunta al contenedor con scroll (Fase C, Etapa 3): el inbox lo usa
 * para el auto-scroll al fondo sin duplicar este componente.
 */
export const ConversationThreadView = forwardRef<
  HTMLDivElement,
  ConversationThreadViewProps
>(function ConversationThreadView(
  { data, isLoading, className, heightClassName = "max-h-[60vh]" },
  ref
) {
  const t = useTranslations("conversations");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-12 w-3/4 ${i % 2 === 0 ? "" : "ml-auto"}`}
          />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        {t("thread.notFound")}
      </p>
    );
  }

  return (
    <div className={className}>
      {data.messagesTruncated && (
        <p className="mb-2 text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
          {t("thread.truncated")}
        </p>
      )}
      <ScrollArea ref={ref} className={`${heightClassName} pr-2`}>
        <div className="space-y-3">
          {data.messages.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              {t("thread.empty")}
            </p>
          ) : (
            buildThreadItems(data).map((item) =>
              item.kind === "message" ? (
                <MessageBubble key={item.message.id} message={item.message} />
              ) : (
                <ConversationEventRow key={item.event.id} event={item.event} />
              )
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
