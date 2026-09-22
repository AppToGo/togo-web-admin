"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import {
  ConversationThreadView,
  isWindowOpen,
  useConversation,
  useConversationByOrder,
  useReleaseConversation,
  useTakeoverConversation,
} from "@/features/conversations";
import { InboxNoteComposer } from "@/features/conversations/components/inbox/inbox-note-composer";
import { InboxWindowNotice } from "@/features/conversations/components/inbox/inbox-window-notice";
import { ReopenConversationNotice } from "@/features/conversations/components/inbox/reopen-conversation-notice";
import type { ConversationDetail } from "@/features/conversations";

interface OrderConversationPanelProps {
  conversationQuery: ReturnType<typeof useConversationByOrder>;
  /**
   * Borrador precargado en el composer (aviso de producto con problema). Su
   * sola presencia es la señal de que se llegó acá desde el ⚠ del producto
   * (no desde un click manual en la pestaña), y dispara el takeover
   * automático — ver `ConversationFooter`.
   */
  draft?: string;
}

/**
 * Pestaña "Conversación" del detalle del pedido: ver el hilo y, con la
 * ventana de 24 h de Meta abierta, escribirle al cliente desde el número del
 * negocio (sin WhatsApp Web).
 *
 * Sin scroll propio (`ConversationThreadView scrollable={false}`): el hilo
 * crece con el contenido y lo scrollea el modal, no un scroll anidado. El pie
 * (botón "Tomar conversación" o el composer) queda `sticky` al fondo del
 * scroll del modal.
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
  const conversation = live ?? conversationQuery.data ?? null;

  // Scroll automático al último mensaje: al enviar uno propio o al llegar
  // uno por WebSocket. El hilo no tiene scroll propio (ver arriba), así que
  // esto scrollea el contenedor ancestro real (el del modal).
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = conversation?.messages.length ?? 0;
  useEffect(() => {
    if (messageCount > 0) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

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

  return (
    <div className="flex flex-col">
      <ConversationThreadView
        data={conversation}
        isLoading={conversationQuery.isLoading || (isLoadingLive && !conversation)}
        scrollable={false}
      />
      <div ref={bottomRef} />
      {conversation && <ConversationFooter conversation={conversation} draft={draft} />}
    </div>
  );
}

function ConversationFooter({
  conversation,
  draft,
}: {
  conversation: ConversationDetail;
  draft?: string;
}) {
  const t = useTranslations("inbox");
  const user = useCurrentUser();
  const { hasPermission } = useMyPermissions();
  const takeover = useTakeoverConversation(conversation.id);
  const release = useReleaseConversation(conversation.id);

  const heldByMe =
    conversation.control === "HUMAN" && conversation.assignedUserId === user?.userId;
  const heldByOther = conversation.control === "HUMAN" && !heldByMe;
  const windowOpen = isWindowOpen(conversation.windowExpiresAt);
  const canTakeover = hasPermission("conversation.takeover");
  // El backend rechaza takeover/release/mensajes con SESSION_CLOSED para
  // cualquier `status` que no sea OPEN (CLOSED o EXPIRED) — independiente de
  // la ventana de 24h, que solo mide el último mensaje del cliente. Una
  // conversación cerrada (ej. al completarse el pedido) puede seguir teniendo
  // la ventana abierta, así que hace falta este chequeo aparte.
  const isClosed = conversation.status !== "OPEN";

  // Llegar acá desde el ⚠ (hay `draft`) toma la conversación sola, sin que el
  // operador tenga que tocar el botón — solo escribir y enviar el mensaje ya
  // cargado. Llegar por click manual en la pestaña (sin `draft`) sí exige el
  // click en "Tomar conversación". Se intenta una sola vez por conversación:
  // un `ref` (no estado) evita el doble intento del StrictMode de React
  // — con estado, las dos invocaciones sincrónicas del efecto en dev podrían
  // no ver todavía el `setState` de la primera — y se limpia si falla para
  // que quede el botón manual.
  const attemptedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!draft || !windowOpen || heldByMe || heldByOther || !canTakeover || isClosed) return;
    if (attemptedRef.current === conversation.id) return;
    attemptedRef.current = conversation.id;
    takeover.mutate(undefined, {
      onError: () => {
        if (attemptedRef.current === conversation.id) attemptedRef.current = null;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, windowOpen, heldByMe, heldByOther, canTakeover, isClosed, conversation.id]);

  if (isClosed) {
    return (
      <div className="sticky bottom-0 bg-white">
        <ReopenConversationNotice
          sessionId={conversation.id}
          windowExpiresAt={conversation.windowExpiresAt}
        />
      </div>
    );
  }

  if (!windowOpen) {
    return (
      <div className="sticky bottom-0">
        <InboxWindowNotice />
      </div>
    );
  }

  if (heldByOther) {
    return (
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-500">
          {t("thread.assignedTo", { name: conversation.assignedTo?.name ?? "" })}
        </p>
      </div>
    );
  }

  if (!heldByMe) {
    const autoTakingOver = !!draft && takeover.isPending;
    return (
      <div className="sticky bottom-0 flex items-center justify-end border-t border-slate-200 bg-white px-4 py-3">
        {autoTakingOver ? (
          <p className="text-sm text-slate-400">{t("actions.takingOver")}</p>
        ) : (
          <Can permission="conversation.takeover">
            <Button size="sm" disabled={takeover.isPending} onClick={() => takeover.mutate()}>
              {t("actions.take")}
            </Button>
          </Can>
        )}
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 border-t border-slate-200 bg-white">
      <div className="flex justify-end px-4 py-1.5">
        <button
          type="button"
          onClick={() => release.mutate(undefined)}
          disabled={release.isPending}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          {t("actions.release")}
        </button>
      </div>
      <InboxNoteComposer conversation={conversation} initialText={draft} />
    </div>
  );
}
