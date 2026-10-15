"use client";

/**
 * Hilo del Inbox en el teléfono (< lg), según el diseño móvil: pantalla
 * completa con volver, el cliente y su estado arriba, y en el pie lo que
 * se puede hacer ahora — tomar la conversación, responder (o escribir una
 * nota interna), reabrirla o el aviso de ventana vencida. El resto de las
 * acciones (asignar, liberar, ver cliente, cerrar) vive en una hoja que
 * sube desde abajo.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  MoreVertical,
  RotateCcw,
  Send,
  StickyNote,
  User,
  UserPlus,
  Undo2,
  XCircle,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { MobileScreen } from "@/components/layout/MobileScreen";
import { BottomSheet, BottomSheetItem } from "@/components/ui/bottom-sheet";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useConversation } from "../../hooks/useConversation";
import { useMarkConversationRead } from "../../hooks/useMarkConversationRead";
import { useThreadAutoScroll } from "../../hooks/useThreadAutoScroll";
import {
  useReleaseConversation,
  useReopenConversation,
  useTakeoverConversation,
} from "../../hooks/useConversationControl";
import { useAssignConversation } from "../../hooks/useAssignConversation";
import { useCloseConversation } from "../../hooks/useCloseConversation";
import {
  useComposerGate,
  useMessageDraft,
  useNoteDraft,
} from "../../hooks/useComposerDraft";
import { isWindowOpen } from "../../utils/conversation-window";
import { ConversationThreadView } from "../conversation-thread/conversation-thread-view";
import { InboxAssignDialog } from "./inbox-assign-dialog";
import { InboxCloseDialog } from "./inbox-close-dialog";
import { InboxWindowNotice } from "./inbox-window-notice";
import { ReopenConversationNotice } from "./reopen-conversation-notice";
import type { ConversationDetail, ConversationOutcome } from "../../types";

interface InboxMobileThreadProps {
  sessionId: string;
  onBack: () => void;
}

export function InboxMobileThread({ sessionId, onBack }: InboxMobileThreadProps) {
  const t = useTranslations("inbox");
  const { data, isLoading } = useConversation(sessionId);
  const { mutate: markConversationRead } = useMarkConversationRead(sessionId);
  const scrollRef = useThreadAutoScroll(isLoading, data?.messages.length);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    markConversationRead();
    // Solo al abrir la conversación (el padre la monta con key={sessionId}).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <MobileScreen
      hiddenFrom="lg"
      onBack={onBack}
      backLabel={t("mobile.back")}
      testId="inbox-mobile-thread"
      title={data ? <ThreadTitle conversation={data} /> : null}
      actions={
        data && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("mobile.actions")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-slate-700 hover:bg-slate-100"
          >
            <MoreVertical className="h-[22px] w-[22px]" />
          </button>
        )
      }
      bodyClassName="overflow-hidden px-3 py-3.5"
      footer={data && <ThreadFooter conversation={data} />}
    >
      <ConversationThreadView
        ref={scrollRef}
        data={data}
        isLoading={isLoading}
        heightClassName="h-full"
      />
      {data && (
        <ThreadActions conversation={data} open={menuOpen} onOpenChange={setMenuOpen} />
      )}
    </MobileScreen>
  );
}

/** "En atención · asignada a ti", "Esperando · sin asignar", "Cerrada"… */
function useStatusText(conversation: ConversationDetail): string {
  const t = useTranslations("inbox");
  const tc = useTranslations("conversations");
  const user = useCurrentUser();

  if (conversation.status !== "OPEN") return tc(`status.${conversation.status}`);
  const control = t(`control.${conversation.control}`);
  if (conversation.control === "BOT") return control;
  const assignee = !conversation.assignedUserId
    ? t("mobile.unassigned")
    : conversation.assignedUserId === user?.userId
      ? t("mobile.assignedToYou")
      : t("mobile.assignedTo", { name: conversation.assignedTo?.name ?? "" });
  return `${control} · ${assignee}`;
}

function ThreadTitle({ conversation }: { conversation: ConversationDetail }) {
  const statusText = useStatusText(conversation);
  const name = conversation.customer?.name ?? conversation.phoneNumber;
  const content = (
    <>
      <InitialsAvatar
        name={conversation.customer?.name}
        seed={conversation.customer?.id ?? conversation.phoneNumber}
        className="h-[38px] w-[38px]"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold text-slate-900">{name}</span>
        <span className="truncate text-xs text-slate-500" data-testid="inbox-mobile-status">
          {statusText}
        </span>
      </span>
    </>
  );

  return conversation.customer ? (
    <Link
      href={`/dashboard/customers/${conversation.customer.id}`}
      className="flex min-w-0 items-center gap-2.5"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-w-0 items-center gap-2.5">{content}</div>
  );
}

function ThreadFooter({ conversation }: { conversation: ConversationDetail }) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const { hasPermission } = useMyPermissions();
  const takeover = useTakeoverConversation(conversation.id);
  const assign = useAssignConversation(conversation.id);
  // Nota interna desde cualquier estado (cerrada, ventana vencida, sin
  // tomar, en manos de otro), como el botón de nota del escritorio.
  const [writingNote, setWritingNote] = useState(false);
  const canNote = hasPermission("conversation.note");
  const gate = useComposerGate(conversation);

  if (gate === "ready") {
    return <MobileComposer conversation={conversation} canNote={canNote} />;
  }
  if (writingNote) {
    return (
      <MobileComposer
        conversation={conversation}
        canNote
        noteOnly
        onCancelNote={() => setWritingNote(false)}
      />
    );
  }

  const noteButton = canNote && (
    <button
      type="button"
      onClick={() => setWritingNote(true)}
      className="flex h-[30px] items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600"
    >
      <StickyNote className="h-3.5 w-3.5" />
      {t("composer.noteToggleOff")}
    </button>
  );

  // Mismas reglas que el composer de escritorio (`useComposerGate`).
  let state: ReactNode;
  if (gate === "closed") {
    state = (
      <ReopenConversationNotice
        sessionId={conversation.id}
        windowExpiresAt={conversation.windowExpiresAt}
      />
    );
  } else if (gate === "windowExpired") {
    state = <InboxWindowNotice />;
  } else if (gate === "heldByOther") {
    // La atiende otro operador: el escritorio no ofrece tomarla (solo
    // liberar o reasignar, que viven en la hoja de acciones).
    state = (
      <p className="px-3 pt-3 text-center text-[13px] text-slate-500">
        {t("mobile.heldByOther", { name: conversation.assignedTo?.name ?? "—" })}
      </p>
    );
  } else if (gate === "unassigned") {
    // En HUMAN sin nadie: no se puede "tomar", pero sí asignársela.
    state = (
      <div className="flex flex-col gap-2 px-3 pt-3">
        <p className="text-center text-[13px] text-slate-500">
          {t("composer.unassignedPrompt")}
        </p>
        {hasPermission("conversation.assign") && user?.userId && (
          <button
            type="button"
            disabled={assign.isPending}
            onClick={() => assign.mutate(user.userId)}
            className="h-[52px] rounded-[14px] bg-indigo-600 text-base font-bold text-white disabled:opacity-60"
          >
            {t("actions.assignToMe")}
          </button>
        )}
      </div>
    );
  } else {
    state = (
      <div className="flex flex-col gap-2 px-3 pt-3">
        <p className="text-center text-[13px] text-slate-500">
          {t("composer.takeoverRequired")}
        </p>
        {hasPermission("conversation.takeover") && (
          <button
            type="button"
            disabled={takeover.isPending}
            onClick={() => takeover.mutate()}
            className="h-[52px] rounded-[14px] bg-indigo-600 text-base font-bold text-white disabled:opacity-60"
          >
            {takeover.isPending ? t("actions.takingOver") : t("actions.take")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-2">
      {state}
      {noteButton && <div className="px-3">{noteButton}</div>}
    </div>
  );
}

interface MobileComposerProps {
  conversation: ConversationDetail;
  canNote: boolean;
  /** Solo nota interna (la conversación no está en mis manos). */
  noteOnly?: boolean;
  onCancelNote?: () => void;
}

function MobileComposer({ conversation, canNote, noteOnly, onCancelNote }: MobileComposerProps) {
  const t = useTranslations("inbox");
  const [noteToggle, setNoteToggle] = useState(false);
  const noteMode = noteOnly || noteToggle;
  // Un borrador por modo: alternar entre mensaje y nota no borra ninguno.
  const message = useMessageDraft(conversation.id);
  const note = useNoteDraft(conversation.id);
  const { text, setText } = noteMode ? note : message;
  const canSubmit = noteMode ? note.canSubmit : message.canSend;
  const placeholder = noteMode ? t("mobile.notePlaceholder") : t("composer.placeholder");

  const submit = () => {
    if (noteMode) note.submit(onCancelNote);
    else message.send();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-2.5 pb-2 pt-2",
        noteMode && "bg-amber-50"
      )}
    >
      {canNote && (
        <button
          type="button"
          aria-pressed={noteMode}
          onClick={() => (noteOnly ? onCancelNote?.() : setNoteToggle(!noteToggle))}
          className={cn(
            "flex h-[30px] items-center gap-1.5 self-start rounded-full border bg-white px-2.5 text-xs font-semibold",
            noteMode ? "border-amber-500 text-amber-800" : "border-slate-200 text-slate-600"
          )}
        >
          <StickyNote className="h-3.5 w-3.5" />
          {noteMode ? t("composer.noteToggleOn") : t("composer.noteToggleOff")}
        </button>
      )}
      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="max-h-32 min-h-[46px] min-w-0 flex-1 resize-none rounded-[23px] border border-slate-200 bg-white px-3.5 py-3 text-[15px] leading-5 text-slate-900 outline-none focus:border-indigo-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label={noteMode ? t("composer.addNote") : t("composer.send")}
          className={cn(
            "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50",
            noteMode ? "bg-amber-600" : "bg-indigo-600"
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface ThreadActionsProps {
  conversation: ConversationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ThreadActions({ conversation, open, onOpenChange }: ThreadActionsProps) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const { hasPermission } = useMyPermissions();
  const [assignOpen, setAssignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const release = useReleaseConversation(conversation.id);
  const reopen = useReopenConversation(conversation.id);
  const assign = useAssignConversation(conversation.id);
  const close = useCloseConversation(conversation.id);

  const isOpen = conversation.status === "OPEN";
  // Las acciones que abren un diálogo esperan a que la hoja termine de
  // cerrarse (`onClosed`), con un respaldo por si la animación no avisa
  // (movimiento reducido); corren una sola vez. Las demás, al toque.
  const afterCloseRef = useRef<(() => void) | null>(null);
  const runAfterClose = () => {
    const action = afterCloseRef.current;
    afterCloseRef.current = null;
    action?.();
  };
  const pick = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };
  const pickThenOpen = (open: () => void) => () => {
    afterCloseRef.current = open;
    onOpenChange(false);
    window.setTimeout(runAfterClose, 500);
  };

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("mobile.actions")}
        onClosed={runAfterClose}
      >
        {isOpen && hasPermission("conversation.assign") && (
          <BottomSheetItem icon={UserPlus} onSelect={pickThenOpen(() => setAssignOpen(true))}>
            {t("mobile.assignOther")}
          </BottomSheetItem>
        )}
        {isOpen && conversation.control === "HUMAN" && hasPermission("conversation.takeover") && (
          <BottomSheetItem
            icon={Undo2}
            disabled={release.isPending}
            onSelect={pick(() => release.mutate(undefined))}
          >
            {t("mobile.releaseToBot")}
          </BottomSheetItem>
        )}
        {!isOpen &&
          isWindowOpen(conversation.windowExpiresAt) &&
          hasPermission("conversation.reopen") && (
            <BottomSheetItem
              icon={RotateCcw}
              disabled={reopen.isPending}
              onSelect={pick(() => reopen.mutate())}
            >
              {t("actions.reopen")}
            </BottomSheetItem>
          )}
        {conversation.customer && (
          <BottomSheetItem
            icon={User}
            onSelect={pick(() =>
              router.push(`/dashboard/customers/${conversation.customer!.id}`)
            )}
          >
            {t("mobile.viewCustomer")}
          </BottomSheetItem>
        )}
        {isOpen && hasPermission("conversation.close") && (
          <BottomSheetItem icon={XCircle} destructive onSelect={pickThenOpen(() => setCloseOpen(true))}>
            {t("mobile.closeConversation")}
          </BottomSheetItem>
        )}
      </BottomSheet>

      <InboxAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        currentAssignedUserId={conversation.assignedUserId}
        onAssign={(userId) =>
          assign.mutate(userId, { onSuccess: () => setAssignOpen(false) })
        }
        isPending={assign.isPending}
      />
      <InboxCloseDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        onConfirm={(outcome?: ConversationOutcome) =>
          close.mutate({ outcome }, { onSuccess: () => setCloseOpen(false) })
        }
        isPending={close.isPending}
      />
    </>
  );
}
