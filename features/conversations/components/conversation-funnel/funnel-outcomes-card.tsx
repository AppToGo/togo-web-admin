"use client";

import { useTranslations } from "next-intl";
import { ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import { SegmentedBreakdown } from "@/features/dashboard/components/charts/SegmentedBreakdown";
import type { ConversationFunnel } from "../../types";

/**
 * Color de cada resultado, el mismo que en "Conversaciones del bot" del
 * dashboard: verde lo que termina en pedido, índigo lo abierto, ámbar lo
 * abandonado y grises el resto.
 */
const OUTCOME_COLOR: Record<string, string> = {
  ORDER_PLACED: "bg-emerald-500",
  ABANDONED: "bg-amber-400",
  SUPPORT: "bg-sky-400",
  NO_INTENT: "bg-slate-400",
  SPAM: "bg-red-400",
  UNSET: "bg-slate-300",
  OPEN: "bg-indigo-400",
};

/** Orden fijo: primero lo que cierra bien, al final lo que sigue abierto. */
const OUTCOME_ORDER = [
  "ORDER_PLACED",
  "ABANDONED",
  "SUPPORT",
  "NO_INTENT",
  "SPAM",
  "UNSET",
  "OPEN",
];

interface FunnelOutcomesCardProps {
  sessions: ConversationFunnel["sessions"];
}

/** Cuántas conversaciones terminaron de cada forma. */
export function FunnelOutcomesCard({ sessions }: FunnelOutcomesCardProps) {
  const t = useTranslations("conversations.funnel.outcomes");
  const rows = Object.entries(sessions.byOutcome).sort(
    ([a], [b]) => rank(a) - rank(b)
  );

  const segments = rows.map(([outcome, count]) => ({
    key: outcome,
    label: t.has(`labels.${outcome}`) ? t(`labels.${outcome}`) : outcome,
    count,
    colorClass: OUTCOME_COLOR[outcome] ?? "bg-slate-300",
  }));

  return (
    <Card variant="glass" className="h-full">
      <DashboardCardHeader
        icon={ListChecks}
        title={t("title")}
        subtitle={t("subtitle", { total: sessions.total })}
      />
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <SegmentedBreakdown
            segments={segments}
            total={sessions.total}
            ariaLabel={segments
              .map((segment) => `${segment.label}: ${segment.count}`)
              .join(", ")}
          />
        )}
      </CardContent>
    </Card>
  );
}

function rank(outcome: string): number {
  const index = OUTCOME_ORDER.indexOf(outcome);
  return index === -1 ? OUTCOME_ORDER.length : index;
}
