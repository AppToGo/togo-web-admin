"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useSendConversationMessage } from "../../hooks/useSendConversationMessage";
import { isWindowOpen } from "../../utils/conversation-window";
import { InboxWindowNotice } from "./inbox-window-notice";
import { ReopenConversationNotice } from "./reopen-conversation-notice";
import type { ConversationDetail } from "../../types";

interface InboxComposerProps {
  conversation: ConversationDetail;
  /** Borrador precargado (ej. aviso de producto agotado desde el detalle del pedido). */
  initialText?: string;
}

export function InboxComposer({ conversation, initialText }: InboxComposerProps) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const [text, setText] = useState(initialText ?? "");
  const sendMessage = useSendConversationMessage(conversation.id);

  const heldByMe =
    conversation.control === "HUMAN" && conversation.assignedUserId === user?.userId;
  const windowOpen = isWindowOpen(conversation.windowExpiresAt);

  // El backend rechaza takeover/mensajes con SESSION_CLOSED para cualquier
  // `status` que no sea OPEN, independiente de la ventana de 24h (que solo
  // mide el último mensaje del cliente) — una conversación cerrada puede
  // seguir teniendo la ventana abierta.
  if (conversation.status !== "OPEN") {
    return (
      <ReopenConversationNotice
        sessionId={conversation.id}
        windowExpiresAt={conversation.windowExpiresAt}
      />
    );
  }

  if (!windowOpen) {
    return <InboxWindowNotice />;
  }

  if (!heldByMe) {
    return (
      <div className="border-t border-slate-200 px-4 py-3">
        <p className="text-sm text-slate-500">{t("composer.takeoverRequired")}</p>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate({ text: trimmed });
    setText("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 px-4 py-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("composer.placeholder")}
        className="min-h-[40px] flex-1 resize-none"
        rows={1}
      />
      <Button
        size="icon"
        disabled={!text.trim() || sendMessage.isPending}
        onClick={handleSend}
        aria-label={t("composer.send")}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
