"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "../../types";

export type InboxTab = "waiting" | "mine" | "unassigned" | "all";

interface InboxTabsProps {
  active: InboxTab;
  onChange: (tab: InboxTab) => void;
  summary: ConversationSummary | undefined;
}

/** Bandejas como pastillas; "Esperando" lleva su contador en ámbar. */
export function InboxTabs({ active, onChange, summary }: InboxTabsProps) {
  const t = useTranslations("inbox");

  const tabs: Array<{ id: InboxTab; label: string; count?: number }> = [
    { id: "waiting", label: t("tabs.waiting"), count: summary?.pendingHuman },
    { id: "mine", label: t("tabs.mine"), count: summary?.mine },
    {
      id: "unassigned",
      label: t("tabs.unassigned"),
      count: summary?.unassigned,
    },
    { id: "all", label: t("tabs.all") },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("mobile.trays")}
      className="flex flex-wrap gap-1.5"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-badge px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-white/75 text-slate-600 hover:bg-white hover:text-slate-900"
            )}
          >
            {tab.label}
            {!!tab.count && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-badge px-1.5 text-xs font-bold tabular-nums",
                  tab.id === "waiting"
                    ? "bg-amber-500 text-white"
                    : isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 text-slate-700"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
