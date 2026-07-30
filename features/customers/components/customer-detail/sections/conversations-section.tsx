"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLazySection } from "../../../hooks/useLazySection";
import { useConversations } from "@/features/conversations/hooks/useConversations";
import { ConversationsTable } from "@/features/conversations/components/conversations-table";
import { ConversationThread } from "@/features/conversations/components/conversation-thread";
import { ConversationsSectionSkeleton } from "../skeletons/sections/conversations-section-skeleton";

interface ConversationsSectionProps {
  customerId: string;
}

export function ConversationsSection({ customerId }: ConversationsSectionProps) {
  const t = useTranslations("conversations");
  const { ref, shouldLoad } = useLazySection(customerId, "conversations");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const {
    data: conversations,
    meta,
    isLoading,
  } = useConversations({ customerId, page: 1, limit: 10 }, shouldLoad);

  const handleSelectConversation = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedSessionId(null);
  }, []);

  return (
    <div ref={ref} className="h-full">
      <Card variant="glass" className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
            {t("detail.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ConversationsSectionSkeleton />
          ) : (
            <ConversationsTable
              data={conversations}
              isLoading={false}
              onSelectConversation={handleSelectConversation}
              pagination={meta}
            />
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
