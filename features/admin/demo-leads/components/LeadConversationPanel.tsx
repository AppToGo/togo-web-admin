"use client";

/**
 * Pestaña "Conversación" de la ficha del lead: hilo del lead con el WhatsApp
 * de la demo y, con permiso (`platform.leads.manage`) y la ventana de 24 h de
 * Meta abierta, tomar la conversación, responderle y soltarla de vuelta al bot.
 *
 * Modelado sobre `OrderConversationPanel`, pero contra los endpoints de
 * `/admin/demo-leads/:id/conversation/*` (el negocio demo no es el negocio
 * efectivo del usuario de plataforma, así que no se reusan los hooks de la
 * bandeja, atados a `useEffectiveBusinessId`).
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { usePlatformPermission } from "@/features/auth/hooks/usePlatformPermission";
import {
  ConversationThreadView,
  isWindowOpen,
  type ConversationDetail,
} from "@/features/conversations";
import { InboxWindowNotice } from "@/features/conversations/components/inbox/inbox-window-notice";
import {
  useLeadConversation,
  useReleaseLeadConversation,
  useSendLeadConversationMessage,
  useTakeoverLeadConversation,
} from "../hooks/useLeadConversation";

interface LeadConversationPanelProps {
  leadId: string;
}

export function LeadConversationPanel({ leadId }: LeadConversationPanelProps) {
  const t = useTranslations("admin-demo-leads");
  const { data, isLoading, isError, refetch } = useLeadConversation(leadId);
  const conversation = data?.conversation ?? null;

  // Scroll al último mensaje cuando llega uno nuevo (polling o envío propio).
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = conversation?.messages.length ?? 0;
  useEffect(() => {
    if (messageCount > 0) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md bg-amber-50 px-4 py-8 text-center">
        <p className="text-sm text-amber-700">{t("conversation.error")}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!isLoading && !conversation) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        {t("conversation.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ConversationThreadView
        data={conversation}
        isLoading={isLoading}
        heightClassName="max-h-[50vh]"
      />
      <div ref={bottomRef} />
      {conversation && (
        <LeadConversationFooter leadId={leadId} conversation={conversation} />
      )}
    </div>
  );
}

function LeadConversationFooter({
  leadId,
  conversation,
}: {
  leadId: string;
  conversation: ConversationDetail;
}) {
  const t = useTranslations("admin-demo-leads");
  const tInbox = useTranslations("inbox");
  const user = useCurrentUser();
  const { allowed: canManage } = usePlatformPermission("platform.leads.manage");
  const takeover = useTakeoverLeadConversation(leadId);
  const release = useReleaseLeadConversation(leadId);

  const heldByMe =
    conversation.control === "HUMAN" &&
    !!user?.userId &&
    conversation.assignedUserId === user.userId;
  const heldByOther = conversation.control === "HUMAN" && !heldByMe;
  const windowOpen = isWindowOpen(conversation.windowExpiresAt);
  // El backend rechaza todo con SESSION_CLOSED si la sesión no está OPEN,
  // aunque la ventana de 24 h siga abierta.
  const isClosed = conversation.status !== "OPEN";

  if (isClosed) {
    return (
      <p className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-600">
        {t("conversation.closed")}
      </p>
    );
  }

  if (!windowOpen) {
    return <InboxWindowNotice />;
  }

  if (!canManage) {
    return (
      <p className="text-sm text-slate-500">{t("conversation.readOnly")}</p>
    );
  }

  if (heldByOther) {
    return (
      <p className="text-sm text-slate-500">
        {tInbox("thread.assignedTo", { name: conversation.assignedTo?.name ?? "" })}
      </p>
    );
  }

  if (!heldByMe) {
    return (
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={takeover.isPending}
          onClick={() => takeover.mutate()}
        >
          {takeover.isPending ? tInbox("actions.takingOver") : tInbox("actions.take")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => release.mutate(undefined)}
          disabled={release.isPending}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          {tInbox("actions.release")}
        </button>
      </div>
      <LeadMessageComposer leadId={leadId} />
    </div>
  );
}

function LeadMessageComposer({ leadId }: { leadId: string }) {
  const tInbox = useTranslations("inbox");
  const send = useSendLeadConversationMessage(leadId);
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    send.mutate(
      { text: trimmed },
      {
        onSuccess: () => setText(""),
      }
    );
  };

  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={tInbox("composer.placeholder")}
        className="min-h-[40px] flex-1 resize-none"
        rows={1}
      />
      <Button
        size="icon"
        disabled={!text.trim() || send.isPending}
        onClick={submit}
        aria-label={tInbox("composer.send")}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
