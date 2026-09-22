"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import {
  ConversationThreadView,
  isWindowOpen,
  useConversation,
  useConversationByOrder,
  useReleaseConversation,
  useTakeoverConversation,
} from "@/features/conversations";
import { InboxNoteComposer } from "@/features/conversations/components/inbox/inbox-note-composer";
import type { ConversationDetail } from "@/features/conversations";

interface OrderConversationPanelProps {
  conversationQuery: ReturnType<typeof useConversationByOrder>;
  /** Borrador precargado en el composer (aviso de producto con problema). */
  draft?: string;
}

/**
 * Pestaña "Conversación" del detalle del pedido: ver el hilo y, con la ventana
 * de 24 h de Meta abierta, tomar la conversación y escribirle al cliente desde
 * el número del negocio (sin WhatsApp Web).
 *
 * `useConversationByOrder` solo resuelve QUÉ sesión es. El hilo se lee con
 * `useConversation(sessionId)` porque el envío optimista, el realtime y las
 * invalidaciones de takeover actualizan esa caché (`detail`), no la de
 * `byOrder` — leer de `byOrder` dejaría el mensaje enviado sin reflejarse.
 */
export function OrderConversationPanel({
  conversationQuery,
  draft,
}: OrderConversationPanelProps) {
  const t = useTranslations("orders");
  const sessionId = conversationQuery.data?.id ?? null;
  const { data: live, isLoading: isLoadingLive } = useConversation(sessionId);

  if (conversationQuery.isError) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 rounded-md text-center py-8 px-4">
        {t("conversationTab.error")}
      </p>
    );
  }

  if (!conversationQuery.isLoading && !conversationQuery.hasConversation) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">
        {t("conversationTab.noConversation")}
      </p>
    );
  }

  const conversation = live ?? conversationQuery.data ?? null;

  return (
    <div className="space-y-3">
      {conversation && <ConversationControlBar conversation={conversation} />}
      <ConversationThreadView
        data={conversation}
        isLoading={conversationQuery.isLoading || (isLoadingLive && !conversation)}
      />
      {conversation && (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <InboxNoteComposer conversation={conversation} initialText={draft} />
        </div>
      )}
    </div>
  );
}

function ConversationControlBar({ conversation }: { conversation: ConversationDetail }) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const takeover = useTakeoverConversation(conversation.id);
  const release = useReleaseConversation(conversation.id);

  const heldByMe =
    conversation.control === "HUMAN" && conversation.assignedUserId === user?.userId;
  const heldByOther = conversation.control === "HUMAN" && !heldByMe;

  // Con la ventana cerrada WhatsApp no deja escribir texto libre, así que no
  // se ofrece tomar la conversación (igual que el composer, que solo muestra
  // el aviso de ventana cerrada).
  const canTake = !heldByMe && !heldByOther && isWindowOpen(conversation.windowExpiresAt);

  if (!heldByMe && !heldByOther && !canTake) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        {heldByOther
          ? t("thread.assignedTo", { name: conversation.assignedTo?.name ?? "" })
          : t(`control.${conversation.control}`)}
      </p>
      <Can permission="conversation.takeover">
        {heldByMe ? (
          <Button
            size="sm"
            variant="outline"
            disabled={release.isPending}
            onClick={() => release.mutate(undefined)}
          >
            {t("actions.release")}
          </Button>
        ) : canTake ? (
          <Button size="sm" disabled={takeover.isPending} onClick={() => takeover.mutate()}>
            {t("actions.take")}
          </Button>
        ) : null}
      </Can>
    </div>
  );
}
