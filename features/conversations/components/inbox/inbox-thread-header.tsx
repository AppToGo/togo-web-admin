"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, MoreHorizontal, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useTakeoverConversation,
  useReleaseConversation,
  useReopenConversation,
} from "../../hooks/useConversationControl";
import { useAssignConversation } from "../../hooks/useAssignConversation";
import { useCloseConversation } from "../../hooks/useCloseConversation";
import { isWindowOpen } from "../../utils/conversation-window";
import { InboxAssignDialog } from "./inbox-assign-dialog";
import { InboxCloseDialog } from "./inbox-close-dialog";
import { CONTROL_BADGE } from "./control-badge";
import { initials } from "./inbox-list-item";
import type { ConversationDetail, ConversationOutcome } from "../../types";

/** Botones del encabezado: más altos y redondeados que el `Button` base. */
const ACTION_BUTTON = "h-10 rounded-xl px-4";

interface InboxThreadHeaderProps {
  conversation: ConversationDetail;
}

export function InboxThreadHeader({ conversation }: InboxThreadHeaderProps) {
  const t = useTranslations("inbox");
  const [assignOpen, setAssignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const takeover = useTakeoverConversation(conversation.id);
  const release = useReleaseConversation(conversation.id);
  const reopen = useReopenConversation(conversation.id);
  const assign = useAssignConversation(conversation.id);
  const close = useCloseConversation(conversation.id);

  const name = conversation.customer?.name ?? t("list.anonymous");
  const isBotOrWaiting = conversation.control !== "HUMAN";
  const isClosed = conversation.status !== "OPEN";

  const { hasPermission } = useMyPermissions();
  const canRelease = !isBotOrWaiting && hasPermission("conversation.takeover");
  const canClose = hasPermission("conversation.close");

  const handleAssign = (userId: string | null) => {
    assign.mutate(userId, { onSuccess: () => setAssignOpen(false) });
  };

  const handleClose = (outcome?: ConversationOutcome) => {
    close.mutate({ outcome }, { onSuccess: () => setCloseOpen(false) });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/80 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {initials(conversation.customer?.name ?? null)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isClosed
                  ? "bg-slate-200 text-slate-700"
                  : CONTROL_BADGE[conversation.control]
              )}
            >
              {isClosed
                ? t("thread.closed")
                : t(`control.${conversation.control}`)}
            </span>
            <span className="text-[13px] text-slate-500">
              {conversation.assignedTo
                ? t("thread.assignedTo", {
                    name: conversation.assignedTo.name ?? "",
                  })
                : t("thread.unassigned")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isClosed ? (
          // Tomar/Asignar/Cerrar no tienen sentido sobre algo ya cerrado
          // (el backend los rechaza con SESSION_CLOSED igual) — el único
          // control posible acá es reabrirla, y solo con la ventana de
          // 24h todavía abierta.
          isWindowOpen(conversation.windowExpiresAt) ? (
            <Can permission="conversation.reopen">
              <Button
                variant="slate-outline"
                className={ACTION_BUTTON}
                disabled={reopen.isPending}
                onClick={() => reopen.mutate()}
              >
                <RotateCcw />
                {t("actions.reopen")}
              </Button>
            </Can>
          ) : (
            <span className="max-w-xs text-xs text-slate-500">
              {t("reopenNotice.windowExpiredDescription")}
            </span>
          )
        ) : (
          <>
            {isBotOrWaiting && (
              <Can permission="conversation.takeover">
                <Button
                  className={ACTION_BUTTON}
                  disabled={takeover.isPending}
                  onClick={() => takeover.mutate()}
                >
                  {t("actions.take")}
                </Button>
              </Can>
            )}

            <Can permission="conversation.assign">
              <Button
                variant="slate-outline"
                className={ACTION_BUTTON}
                onClick={() => setAssignOpen(true)}
              >
                {t("actions.assign")}
              </Button>
            </Can>

            {/* Liberar y Cerrar: menos frecuentes, van al menú "⋯". */}
            {(canRelease || canClose) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="slate-outline"
                    className={cn(ACTION_BUTTON, "w-10 px-0")}
                    aria-label={t("actions.more")}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {canRelease && (
                    <DropdownMenuItem
                      disabled={release.isPending}
                      onSelect={() => release.mutate(undefined)}
                    >
                      <Bot className="h-4 w-4" />
                      {t("actions.releaseToBot")}
                    </DropdownMenuItem>
                  )}
                  {canClose && (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={() => setCloseOpen(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      {t("actions.closeConversation")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      <InboxAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        currentAssignedUserId={conversation.assignedUserId}
        onAssign={handleAssign}
        isPending={assign.isPending}
      />
      <InboxCloseDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        onConfirm={handleClose}
        isPending={close.isPending}
      />
    </div>
  );
}
