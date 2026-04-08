"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  variant?: "emerald" | "blue" | "purple" | "amber" | "default";
}

export const KpiCard = memo(function KpiCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  variant = "default",
}: KpiCardProps) {
  return (
    <Card
      variant={`metrics-${variant}`}
      className="hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 truncate">
              {value}
            </p>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {description}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
            {icon}
          </div>
        </div>

        {trendValue !== undefined && trend !== "neutral" && (
          <div
            className={`mt-3 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? "↑" : "↓"} {Math.abs(trendValue).toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
});
