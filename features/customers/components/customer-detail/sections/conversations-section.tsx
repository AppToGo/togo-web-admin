"use client";

import { useCallback, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLazySection } from "../../../hooks/useLazySection";
import { useConversations } from "@/features/conversations/hooks/useConversations";
import { ConversationOutcomeBadge } from "@/features/conversations/components/conversation-outcome-badge";
import { ConversationThread } from "@/features/conversations/components/conversation-thread";
import { ConversationsSectionSkeleton } from "../skeletons/sections/conversations-section-skeleton";

interface ConversationsSectionProps {
  customerId: string;
}

export function ConversationsSection({ customerId }: ConversationsSectionProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("customers");
  const format = useFormatter();
  const { ref, shouldLoad } = useLazySection(customerId, "conversations");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const {
    data: conversations,
    meta,
    isLoading,
    isError,
  } = useConversations({ customerId, page: 1, limit: 10 }, shouldLoad);

  // Con la query deshabilitada (todavía no intersectó), isLoading es false
  // (una query en enabled:false nunca entra en estado de carga) — sin este
  // OR, la card muestra "sin conversaciones" antes de haber intentado el
  // fetch (mismo síntoma que orders-section.tsx, no corregido acá por estar
  // fuera del alcance de este PR).
  const showSkeleton = !shouldLoad || isLoading;

  const handleSelectConversation = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedSessionId(null);
  }, []);

  return (
    <div ref={ref}>
      <Card variant="glass">
        <DashboardCardHeader icon={MessageCircle} title={t("detail.title")} />
        <CardContent>
          {showSkeleton ? (
            <ConversationsSectionSkeleton />
          ) : isError ? (
            <p className="py-6 text-center text-sm text-slate-500">{t("error.title")}</p>
          ) : conversations.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">{t("empty.title")}</p>
          ) : (
            <div className="space-y-3">
              <ul className="space-y-2.5">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] border border-white/90 bg-white/65 px-4 py-3.5 text-left transition-colors hover:border-indigo-200 hover:bg-white"
                    >
                      <span className="flex min-w-40 flex-1 flex-col">
                        <span className="text-[15px] font-semibold text-slate-900">
                          {format.dateTime(new Date(conversation.startedAt), {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[13px] text-slate-500">
                          {tc("detail.conversationMessages", {
                            count: conversation.messageCount,
                          })}
                          {conversation.orderIds.length > 0 &&
                            ` · ${tc("detail.conversationWithOrder")}`}
                        </span>
                      </span>
                      <ConversationOutcomeBadge
                        outcome={conversation.outcome}
                        status={conversation.status}
                        className="rounded-full"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              {meta && meta.total > conversations.length && (
                <p className="text-center text-sm text-slate-500">
                  {tc("detail.conversationsShowing", {
                    shown: conversations.length,
                    total: meta.total,
                  })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {t("detail.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {selectedSessionId && (
              <ConversationThread sessionId={selectedSessionId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
