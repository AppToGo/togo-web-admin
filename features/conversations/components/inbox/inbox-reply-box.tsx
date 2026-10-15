"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import {
  useReleaseConversation,
  useTakeoverConversation,
} from "../../hooks/useConversationControl";
import { useAssignConversation } from "../../hooks/useAssignConversation";
import {
  submitOnEnter,
  useComposerGate,
  useMessageDraft,
  useNoteDraft,
} from "../../hooks/useComposerDraft";
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
 *
 * Los dos borradores viven acá y no en cada formulario: cambiar de pestaña
 * no borra lo que se estaba escribiendo. Quien lo monta debe darle
 * `key={conversation.id}` para que no pasen de una conversación a otra.
 */
export function InboxReplyBox({ conversation }: InboxReplyBoxProps) {
  const t = useTranslations("inbox");
  const { hasPermission } = useMyPermissions();
  const canNote = hasPermission("conversation.note");
  const [mode, setMode] = useState<Mode>("reply");
  const isNote = mode === "note" && canNote;
  const message = useMessageDraft(conversation.id);
  const note = useNoteDraft(conversation.id);

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
          <NoteForm draft={note} />
        ) : (
          <ReplyForm conversation={conversation} draft={message} />
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

function ReplyForm({
  conversation,
  draft,
}: {
  conversation: ConversationDetail;
  draft: ReturnType<typeof useMessageDraft>;
}) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const gate = useComposerGate(conversation);
  const takeover = useTakeoverConversation(conversation.id);
  const release = useReleaseConversation(conversation.id);
  const assign = useAssignConversation(conversation.id);

  switch (gate) {
    case "closed":
      return (
        <ReopenConversationNotice
          sessionId={conversation.id}
          windowExpiresAt={conversation.windowExpiresAt}
        />
      );
    case "windowExpired":
      return <InboxWindowNotice />;
    case "heldByOther":
      // La tiene otro operador: no se le quita desde acá.
      return (
        <p className="px-4 pb-4 pt-3 text-sm text-slate-600">
          {t("mobile.heldByOther", { name: conversation.assignedTo?.name ?? "" })}
        </p>
      );
    case "unassigned":
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-3">
          <p className="text-sm text-slate-600">{t("composer.unassignedPrompt")}</p>
          <Can permission="conversation.assign">
            <Button
              className={ACTION_BUTTON}
              disabled={assign.isPending || !user?.userId}
              onClick={() => user?.userId && assign.mutate(user.userId)}
            >
              {t("actions.assignToMe")}
            </Button>
          </Can>
        </div>
      );
    case "needsTakeover":
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

  return (
    <>
      <div className="px-4 pt-3">
        <textarea
          value={draft.text}
          onChange={(e) => draft.setText(e.target.value)}
          onKeyDown={submitOnEnter(draft.send)}
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
            disabled={!draft.canSend}
            onClick={draft.send}
          >
            <Send />
            {t("composer.send")}
          </Button>
        </div>
      </div>
    </>
  );
}

function NoteForm({ draft }: { draft: ReturnType<typeof useNoteDraft> }) {
  const t = useTranslations("inbox");

  return (
    <>
      <div className="px-4 pt-3">
        <textarea
          value={draft.text}
          onChange={(e) => draft.setText(e.target.value)}
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
          disabled={!draft.canSubmit}
          onClick={() => draft.submit()}
        >
          {t("composer.addNote")}
        </Button>
      </div>
    </>
  );
}
