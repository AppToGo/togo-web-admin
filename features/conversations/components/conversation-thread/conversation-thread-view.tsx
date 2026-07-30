"use client";

import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./message-bubble";
import type { ConversationDetail } from "../../types";

interface ConversationThreadViewProps {
  data: ConversationDetail | null | undefined;
  isLoading: boolean;
  className?: string;
}

/**
 * Parte presentacional de `ConversationThread`, separada para que
 * `OrderDetailContent` pueda reusarla con los datos que ya trae
 * `useConversationByOrder` (que resuelve sesión + hilo en una sola
 * llamada) sin disparar un segundo fetch por `sessionId`.
 */
export function ConversationThreadView({
  data,
  isLoading,
  className,
}: ConversationThreadViewProps) {
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
      <ScrollArea className="max-h-[60vh] pr-2">
        <div className="space-y-3">
          {data.messages.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              {t("thread.empty")}
            </p>
          ) : (
            data.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
