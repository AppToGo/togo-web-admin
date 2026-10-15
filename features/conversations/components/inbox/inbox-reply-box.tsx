"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Send, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useSendConversationMessage } from "../../hooks/useSendConversationMessage";
import { useAddConversationNote } from "../../hooks/useAddConversationNote";
import {
  useReleaseConversation,
  useTakeoverConversation,
} from "../../hooks/useConversationControl";
import { isWindowOpen } from "../../utils/conversation-window";
import { InboxWindowNotice } from "./inbox-window-notice";
import { ReopenConversationNotice } from "./reopen-conversation-notice";
import type { ConversationDetail } from "../../types";

type Mode = "reply" | "note";

interface InboxReplyBoxProps {
  conversation: ConversationDetail;
}

const TEXTAREA =
  "min-h-16 w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none";
const ACTION_BUTTON = "h-10 rounded-xl px-4";

/**
 * Compositor del Inbox de escritorio: pestañas "Responder | Nota interna"
 * en una tarjeta. Si la conversación no la tiene uno tomada, ofrece tomarla
 * ahí mismo (antes el aviso estaba abajo y el botón arriba a la derecha).
 */
export function InboxReplyBox({ conversation }: InboxReplyBoxProps) {
  const t = useTranslations("inbox");
  const { hasPermission } = useMyPermissions();
  const canNote = hasPermission("conversation.note");
  const [mode, setMode] = useState<Mode>("reply");
  const isNote = mode === "note" && canNote;

  return (
    <div className="px-4 pb-4">
      <div
        className={cn(
          "overflow-hidden rounded-3xl shadow-card",
          isNote ? "bg-amber-50 ring-1 ring-amber-200" : "bg-white"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2">
          <div role="tablist" aria-label={t("composer.modes")} className="flex gap-1">
            <ModeTab active={!isNote} onClick={() => setMode("reply")}>
              {t("composer.reply")}
            </ModeTab>
            {canNote && (
              <ModeTab active={isNote} tone="amber" onClick={() => setMode("note")}>
                <StickyNote className="h-3.5 w-3.5" />
                {t("composer.noteToggleOff")}
              </ModeTab>
            )}
          </div>
          {isNote && (
            <span className="px-2 text-xs text-amber-800">{t("composer.noteHint")}</span>
          )}
        </div>
        {isNote ? (
          <NoteForm sessionId={conversation.id} />
        ) : (
          <ReplyForm conversation={conversation} />
        )}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  tone = "indigo",
  onClick,
  children,
}: {
  active: boolean;
  tone?: "indigo" | "amber";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] transition-colors",
        active
          ? tone === "amber"
            ? "bg-amber-100 font-semibold text-amber-800"
            : "bg-indigo-50 font-semibold text-indigo-700"
          : "font-medium text-slate-500 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function ReplyForm({ conversation }: { conversation: ConversationDetail }) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const [text, setText] = useState("");
  const sendMessage = useSendConversationMessage(conversation.id);
  const takeover = useTakeoverConversation(conversation.id);
  const release = useReleaseConversation(conversation.id);

  const heldByMe =
    conversation.control === "HUMAN" && conversation.assignedUserId === user?.userId;

  // El backend rechaza mensajes con SESSION_CLOSED para cualquier `status`
  // que no sea OPEN, aunque la ventana de 24h siga abierta.
  if (conversation.status !== "OPEN") {
    return (
      <ReopenConversationNotice
        sessionId={conversation.id}
        windowExpiresAt={conversation.windowExpiresAt}
      />
    );
  }

  if (!isWindowOpen(conversation.windowExpiresAt)) {
    return <InboxWindowNotice />;
  }

  if (!heldByMe) {
    // La tiene otro operador: no se le quita desde acá.
    if (conversation.control === "HUMAN") {
      return (
        <p className="px-4 pb-4 pt-3 text-sm text-slate-600">
          {t("mobile.heldByOther", { name: conversation.assignedTo?.name ?? "" })}
        </p>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-3">
        <p className="text-sm text-slate-600">{t("composer.takeoverPrompt")}</p>
        <Can
          permission="conversation.takeover"
          fallback={<p className="text-sm text-slate-500">{t("composer.takeoverRequired")}</p>}
        >
          <Button
            className={ACTION_BUTTON}
            disabled={takeover.isPending}
            onClick={() => takeover.mutate()}
          >
            {t("actions.takeAndReply")}
          </Button>
        </Can>
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
    <>
      <div className="px-4 pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("composer.placeholder")}
          aria-label={t("composer.placeholder")}
          rows={2}
          className={TEXTAREA}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-1">
        <span className="text-xs text-slate-500">{t("composer.sendHint")}</span>
        <div className="flex gap-2">
          <Can permission="conversation.takeover">
            <Button
              variant="slate-outline"
              className={ACTION_BUTTON}
              disabled={release.isPending}
              onClick={() => release.mutate(undefined)}
            >
              {t("actions.releaseToBot")}
            </Button>
          </Can>
          <Button
            className={ACTION_BUTTON}
            disabled={!text.trim() || sendMessage.isPending}
            onClick={handleSend}
          >
            <Send />
            {t("composer.send")}
          </Button>
        </div>
      </div>
    </>
  );
}

function NoteForm({ sessionId }: { sessionId: string }) {
  const t = useTranslations("inbox");
  const [text, setText] = useState("");
  const addNote = useAddConversationNote(sessionId);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addNote.mutate({ text: trimmed }, { onSuccess: () => setText("") });
  };

  return (
    <>
      <div className="px-4 pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("composer.notePlaceholder")}
          aria-label={t("composer.notePlaceholder")}
          rows={2}
          className={TEXTAREA}
        />
      </div>
      <div className="flex justify-end px-4 pb-3 pt-1">
        <Button
          variant="amber"
          className={ACTION_BUTTON}
          disabled={!text.trim() || addNote.isPending}
          onClick={handleSubmit}
        >
          {t("composer.addNote")}
        </Button>
      </div>
    </>
  );
}
