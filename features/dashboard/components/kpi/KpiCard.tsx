"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendBadge } from "./TrendBadge";

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  /** Variación vs el período anterior; sin valor o en 0 no se muestra. */
  trendValue?: number;
  variant?: "emerald" | "blue" | "purple" | "amber" | "default";
}

export const KpiCard = memo(function KpiCard({
  title,
  value,
  description,
  icon,
  trendValue,
  variant = "default",
}: KpiCardProps) {
  return (
    <Card
      variant={`metrics-${variant}`}
      className="hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1 truncate">
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {description}
            </p>
          </div>
          {/* En el teléfono el ícono le quita espacio al número. */}
          <div className="hidden md:flex w-11 h-11 shrink-0 rounded-icon items-center justify-center bg-white/75">
            {icon}
          </div>
        </div>

        {trendValue !== undefined && trendValue !== 0 && (
          <div className="mt-3">
            <TrendBadge value={trendValue} />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
