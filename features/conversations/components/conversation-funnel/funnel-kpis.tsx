"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Headset, LogOut, MessagesSquare } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi/KpiCard";
import type { ConversationFunnel } from "../../types";
import { formatNumber, formatRate } from "./funnel-format";

interface FunnelKpisProps {
  data: ConversationFunnel;
}

/** Resultado de las conversaciones del período, en cuatro números. */
export function FunnelKpis({ data }: FunnelKpisProps) {
  const t = useTranslations("conversations.funnel.kpis");
  const { sessions, messagesToOrder } = data;
  const open = sessions.byOutcome.OPEN ?? 0;
  const closed = sessions.total - open;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        title={t("order.title")}
        value={formatRate(sessions.rates.order)}
        description={t("order.description", {
          count: sessions.byOutcome.ORDER_PLACED ?? 0,
          closed,
        })}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        variant="emerald"
      />
      <KpiCard
        title={t("abandoned.title")}
        value={formatRate(sessions.rates.abandoned)}
        description={t("abandoned.description", {
          count: sessions.byOutcome.ABANDONED ?? 0,
          closed,
        })}
        icon={<LogOut className="w-5 h-5 text-amber-500" />}
        variant="amber"
      />
      <KpiCard
        title={t("handoff.title")}
        value={formatRate(sessions.rates.handoff)}
        description={t("handoff.description", {
          count: sessions.handoffRequested,
          total: sessions.total,
        })}
        icon={<Headset className="w-5 h-5 text-blue-500" />}
        variant="blue"
      />
      <KpiCard
        title={t("messages.title")}
        value={formatNumber(messagesToOrder.median)}
        description={
          messagesToOrder.orders > 0
            ? t("messages.description", {
                average: formatNumber(messagesToOrder.average),
              })
            : t("messages.empty")
        }
        icon={<MessagesSquare className="w-5 h-5 text-purple-500" />}
        variant="purple"
      />
    </div>
  );
}
