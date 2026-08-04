"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "../../types";

interface InboxListItemProps {
  conversation: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}

function initials(name: string | null): string {
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
      return "bg-slate-300";
  }
}

export function InboxListItem({ conversation, isSelected, onClick }: InboxListItemProps) {
  const t = useTranslations("inbox");
  const name = conversation.customer?.name ?? null;
  const preview = conversation.outcome
    ? t(`control.${conversation.control}`)
    : conversation.phoneNumber;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
      )}
    >
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
          {initials(name)}
        </div>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
            controlDotColor(conversation.control)
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-slate-900">
            {name ?? t("list.anonymous")}
          </span>
          <span className="shrink-0 text-[10px] text-slate-400">
            {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-slate-500">{preview}</span>
          {conversation.unreadCount > 0 && (
            <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
