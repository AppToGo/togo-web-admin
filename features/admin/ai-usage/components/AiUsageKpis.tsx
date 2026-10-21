"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  MessagesSquare,
  ReceiptText,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiUsageTotals } from "@/types/ai-usage.types";
import {
  formatCount,
  formatUsd,
} from "@/features/admin/ai-usage/utils/ai-usage.utils";

/** Gasto total, costo por pedido, por conversación y llamadas del periodo. */
export function AiUsageKpis({
  totals,
  isLoading,
}: {
  totals?: AiUsageTotals;
  isLoading: boolean;
}) {
  const t = useTranslations("admin-ai-usage");
  const locale = useLocale();

  const kpis = [
    {
      label: t("kpis.total"),
      value: formatUsd(totals?.costUsd ?? 0, locale),
      hint: t("kpis.calls", { count: formatCount(totals?.calls ?? 0, locale) }),
      icon: Sparkles,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: t("kpis.perOrder"),
      value: formatUsd(totals?.costPerOrderUsd, locale),
      hint: t("kpis.orders", { count: totals?.orders ?? 0 }),
      icon: ShoppingBag,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: t("kpis.perConversation"),
      value: formatUsd(totals?.costPerConversationUsd, locale),
      hint: t("kpis.conversations", { count: totals?.conversations ?? 0 }),
      icon: MessagesSquare,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: t("kpis.tokens"),
      value: formatCount(
        (totals?.inputTokens ?? 0) + (totals?.outputTokens ?? 0),
        locale
      ),
      hint: t("kpis.audio", {
        minutes: formatCount((totals?.audioSeconds ?? 0) / 60, locale, 1),
      }),
      icon: ReceiptText,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map(({ label, value, hint, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex items-center gap-3.5 rounded-[20px] border border-white/90 bg-white/65 px-4 py-3.5 md:rounded-3xl md:px-5"
        >
          <span
            className={cn(
              "hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:flex",
              tone
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <dt className="truncate text-xs text-slate-500 md:text-[13px]">
              {label}
            </dt>
            <dd className="mt-0.5 truncate text-xl font-bold tabular-nums text-slate-900 md:text-2xl">
              {isLoading ? "–" : value}
            </dd>
            <dd className="truncate text-xs text-slate-500">
              {isLoading ? "" : hint}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
