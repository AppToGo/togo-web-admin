"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useSendConversationMessage } from "../../hooks/useSendConversationMessage";
import { InboxWindowNotice } from "./inbox-window-notice";
import type { ConversationDetail } from "../../types";

interface InboxComposerProps {
  conversation: ConversationDetail;
}

function isWindowOpen(windowExpiresAt: string | null): boolean {
  if (!windowExpiresAt) return false;
  return new Date(windowExpiresAt).getTime() > Date.now();
}

export function InboxComposer({ conversation }: InboxComposerProps) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const [text, setText] = useState("");
  const sendMessage = useSendConversationMessage(conversation.id);

  const heldByMe =
    conversation.control === "HUMAN" && conversation.assignedUserId === user?.userId;
  const windowOpen = isWindowOpen(conversation.windowExpiresAt);

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
