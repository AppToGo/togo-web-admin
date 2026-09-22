"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { isWindowOpen } from "../../utils/conversation-window";
import { useReopenConversation } from "../../hooks/useConversationControl";

interface ReopenConversationNoticeProps {
  sessionId: string;
  windowExpiresAt: string | null;
}

/**
 * Reemplaza al texto plano "conversación cerrada" en los 3 lugares donde el
 * front ya detecta `status !== "OPEN"` (panel de conversación del pedido,
 * composer del inbox, header del inbox). Con la ventana de 24h abierta
 * ofrece reabrir; si ya venció, solo explica por qué tampoco se puede.
 */
export function ReopenConversationNotice({
  sessionId,
  windowExpiresAt,
}: ReopenConversationNoticeProps) {
  const t = useTranslations("inbox");
  const reopen = useReopenConversation(sessionId);
  const windowOpen = isWindowOpen(windowExpiresAt);

  return (
    <div className="border-t border-slate-200 px-4 py-3">
      <p className="text-sm font-medium text-slate-700">
        {t("reopenNotice.title")}
      </p>
      {windowOpen ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{t("reopenNotice.description")}</p>
          <Can permission="conversation.reopen">
            <Button
              size="sm"
              variant="outline"
              disabled={reopen.isPending}
              onClick={() => reopen.mutate()}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {t("actions.reopen")}
            </Button>
          </Can>
        </div>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          {t("reopenNotice.windowExpiredDescription")}
        </p>
      )}
    </div>
  );
}
