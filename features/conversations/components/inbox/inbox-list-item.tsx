"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import type { ConversationListItem } from "../../types";

interface InboxListItemProps {
  conversation: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}

export function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function controlDotColor(control: ConversationListItem["control"]): string {
  switch (control) {
    case "HUMAN":
      return "bg-emerald-500";
    case "PENDING_HUMAN":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}

/**
 * Quién la atiende, en palabras (el punto de color solo no se entiende):
 * "Pidió un asesor", "La estás atendiendo", "La atiende Juan", "La atiende
 * el bot" o "Cerrada".
 */
function useStatusLine(conversation: ConversationListItem) {
  const t = useTranslations("inbox.list.status");
  const user = useCurrentUser();

  if (conversation.status !== "OPEN") {
    return { text: t("closed"), className: "text-slate-500" };
  }
  switch (conversation.control) {
    case "PENDING_HUMAN":
      return { text: t("waiting"), className: "font-medium text-amber-700" };
    case "HUMAN":
      if (conversation.assignedUserId && conversation.assignedUserId === user?.userId) {
        return { text: t("mine"), className: "text-emerald-700" };
      }
      return conversation.assignedTo?.name
        ? {
            text: t("heldBy", { name: conversation.assignedTo.name }),
            className: "text-slate-500",
          }
        : { text: t("unassigned"), className: "text-slate-500" };
    default:
      return { text: t("bot"), className: "text-slate-500" };
  }
}

/** "ahora", "4 min", "12:10" (hoy), "Ayer" o "12 oct". */
function useRelativeTime(iso: string): string {
  const t = useTranslations("inbox.list.time");
  const locale = useLocale();
  const date = new Date(iso);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (minutes < 1) return t("now");
  if (minutes < 60) return t("minutes", { count: minutes });

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (date >= startOfToday) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfYesterday) return t("yesterday");

  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function InboxListItem({
  conversation,
  isSelected,
  onClick,
}: InboxListItemProps) {
  const t = useTranslations("inbox");
  const name = conversation.customer?.name ?? null;
  const status = useStatusLine(conversation);
  const time = useRelativeTime(conversation.lastMessageAt);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition-colors",
        isSelected
          ? "border-indigo-200 bg-white shadow-card"
          : "border-transparent hover:bg-white/70"
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold",
            name ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
          )}
        >
          {initials(name)}
        </div>
        <span
          className={cn(
            "absolute -bottom-px -right-px h-3 w-3 rounded-full border-2 border-white",
            controlDotColor(conversation.control)
          )}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">
            {name ?? conversation.phoneNumber ?? t("list.anonymous")}
          </span>
          <span className="shrink-0 text-xs text-slate-500">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[13px]", status.className)}>
            {status.text}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-badge bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
