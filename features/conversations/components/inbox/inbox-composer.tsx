"use client";

import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  submitOnEnter,
  useComposerGate,
  useMessageDraft,
} from "../../hooks/useComposerDraft";
import { InboxWindowNotice } from "./inbox-window-notice";
import { ReopenConversationNotice } from "./reopen-conversation-notice";
import type { ConversationDetail } from "../../types";

interface InboxComposerProps {
  conversation: ConversationDetail;
  /** Borrador precargado (ej. aviso de producto agotado desde el detalle del pedido). */
  initialText?: string;
}

/**
 * Composer compacto del panel de conversación del pedido. Comparte con el
 * Inbox (`InboxReplyBox`) las reglas de cuándo se puede escribir y el
 * borrador (`useComposerDraft`).
 */
export function InboxComposer({ conversation, initialText }: InboxComposerProps) {
  const t = useTranslations("inbox");
  const gate = useComposerGate(conversation);
  const draft = useMessageDraft(conversation.id, initialText);

  if (gate === "closed") {
    return (
      <ReopenConversationNotice
        sessionId={conversation.id}
        windowExpiresAt={conversation.windowExpiresAt}
      />
    );
  }

  if (gate === "windowExpired") {
    return <InboxWindowNotice />;
  }

  if (gate !== "ready") {
    return (
      <div className="border-t border-slate-200 px-4 py-3">
        <p className="text-sm text-slate-500">{t("composer.takeoverRequired")}</p>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 px-4 py-3">
      <Textarea
        value={draft.text}
        onChange={(e) => draft.setText(e.target.value)}
        onKeyDown={submitOnEnter(draft.send)}
        placeholder={t("composer.placeholder")}
        className="min-h-[40px] flex-1 resize-none"
        rows={1}
      />
      <Button
        size="icon"
        disabled={!draft.canSend}
        onClick={draft.send}
        aria-label={t("composer.send")}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
