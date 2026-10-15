"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import { KpiCard } from "./KpiCard";

export const AverageTicketCard = memo(function AverageTicketCard() {
  const t = useTranslations("dashboard.stats.averageTicket");
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  const avgTicket =
    data && data.paidOrders > 0 ? data.periodRevenue / data.paidOrders : 0;

  return (
    <KpiCard
      title={t("title")}
      value={formatCOP(avgTicket)}
      description={t("description")}
      icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
      variant="amber"
    />
  );
});
