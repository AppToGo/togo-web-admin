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

export function InboxTabs({ active, onChange, summary }: InboxTabsProps) {
  const t = useTranslations("inbox");

  const tabs: Array<{ id: InboxTab; label: string; count?: number }> = [
    { id: "waiting", label: t("tabs.waiting"), count: summary?.pendingHuman },
    { id: "mine", label: t("tabs.mine"), count: summary?.mine },
    { id: "unassigned", label: t("tabs.unassigned"), count: summary?.unassigned },
    { id: "all", label: t("tabs.all") },
  ];

  return (
    <div role="tablist" className="flex gap-1 border-b border-slate-200 px-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
          )}
        >
          {tab.label}
          {!!tab.count && (
            <span className="rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
