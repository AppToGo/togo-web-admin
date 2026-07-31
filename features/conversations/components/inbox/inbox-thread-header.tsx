"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import {
  useTakeoverConversation,
  useReleaseConversation,
} from "../../hooks/useConversationControl";
import { useAssignConversation } from "../../hooks/useAssignConversation";
import { useCloseConversation } from "../../hooks/useCloseConversation";
import { InboxAssignDialog } from "./inbox-assign-dialog";
import { InboxCloseDialog } from "./inbox-close-dialog";
import type { ConversationDetail, ConversationOutcome } from "../../types";

interface InboxThreadHeaderProps {
  conversation: ConversationDetail;
}

function controlBadgeVariant(control: ConversationDetail["control"]): string {
  switch (control) {
    case "HUMAN":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING_HUMAN":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function InboxThreadHeader({ conversation }: InboxThreadHeaderProps) {
  const t = useTranslations("inbox");
  const [assignOpen, setAssignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const takeover = useTakeoverConversation(conversation.id);
  const release = useReleaseConversation(conversation.id);
  const assign = useAssignConversation(conversation.id);
  const close = useCloseConversation(conversation.id);

  const name = conversation.customer?.name ?? t("list.anonymous");
  const isBotOrWaiting = conversation.control !== "HUMAN";

  const handleAssign = (userId: string | null) => {
    assign.mutate(userId, { onSuccess: () => setAssignOpen(false) });
  };

  const handleClose = (outcome?: ConversationOutcome) => {
    close.mutate({ outcome }, { onSuccess: () => setCloseOpen(false) });
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              controlBadgeVariant(conversation.control)
            )}
          >
            {t(`control.${conversation.control}`)}
          </span>
          <span className="text-xs text-slate-500">
            {conversation.assignedTo
              ? t("thread.assignedTo", { name: conversation.assignedTo.name ?? "" })
              : t("thread.unassigned")}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Can permission="conversation.takeover">
          {isBotOrWaiting ? (
            <Button
              size="sm"
              variant="default"
              disabled={takeover.isPending}
              onClick={() => takeover.mutate()}
            >
              {t("actions.take")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={release.isPending}
              onClick={() => release.mutate(undefined)}
            >
              {t("actions.release")}
            </Button>
          )}
        </Can>

        <Can permission="conversation.assign">
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
            {t("actions.assign")}
          </Button>
        </Can>

        <Can permission="conversation.close">
          <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>
            {t("actions.close")}
          </Button>
        </Can>
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
