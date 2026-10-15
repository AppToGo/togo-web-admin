"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { useKpiMetrics } from "../../hooks/useKpiMetrics";
import { CardSkeleton } from "../loading/CardSkeleton";
import { KpiCard } from "./KpiCard";

/**
 * Pedidos de HOY: la API calcula `conteos.hoy` con el día actual sin
 * importar el filtro, por eso esta tarjeta no muestra tendencia del período.
 */
export const OrdersTodayCard = memo(function OrdersTodayCard() {
  const t = useTranslations("dashboard.stats.ordersToday");
  const { data, isLoading } = useKpiMetrics();

  if (isLoading) {
    return <CardSkeleton className="h-36" />;
  }

  return (
    <KpiCard
      title={t("title")}
      value={(data?.ordersToday ?? 0).toString()}
      description={t("description", { count: data?.ordersCompletedToday ?? 0 })}
      icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />}
      variant="emerald"
    />
  );
});
