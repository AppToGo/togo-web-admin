"use client";

import { memo } from "react";
import {
  RefreshCw,
  PlusCircle,
  CreditCard,
  XCircle,
  FileText,
  MessageCircle,
  Edit3,
  Upload,
} from "lucide-react";
import { useRecentActivity } from "../hooks/useOrders";
import { getTimeElapsed } from "../utils/order-status.utils";
import { activityIconVariants } from "../styles";
import { Skeleton } from "@/components/ui/skeleton";

const ACTIVITY_ICONS = {
  status_change: RefreshCw,
  new_order: PlusCircle,
  payment_received: CreditCard,
  cancelled: XCircle,
  document_uploaded: Upload,
  comment: MessageCircle,
  edit: Edit3,
  file: FileText,
};

const ACTIVITY_VARIANTS = {
  status_change: "blue",
  new_order: "green",
  payment_received: "purple",
  cancelled: "red",
  document_uploaded: "orange",
  comment: "blue",
  edit: "purple",
  file: "orange",
} as const;

export const RecentActivity = memo(function RecentActivity() {
  const activities = useRecentActivity();

  // Si no hay actividades, no mostrar nada (o mostrar mensaje vacío opcional)
  if (activities.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-slate-400">
          No hay actividad reciente
        </p>
      </div>
    );
  }

  // Mostrar máximo 5 actividades
  const displayActivities = activities.slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900 text-base">
        Actividad reciente
      </h3>

      <div className="space-y-3">
        {displayActivities.map((activity) => {
          const Icon =
            ACTIVITY_ICONS[activity.type as keyof typeof ACTIVITY_ICONS] ||
            RefreshCw;
          const variant =
            ACTIVITY_VARIANTS[
              activity.type as keyof typeof ACTIVITY_VARIANTS
            ] || "blue";

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 group cursor-pointer hover:bg-white/40 -mx-2 px-2 py-2 rounded-card transition-colors"
            >
              {/* Icono circular con color */}
              <div
                className={activityIconVariants({ variant: variant as any })}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-slate-700 leading-snug">
                  {activity.description}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {getTimeElapsed(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export function RecentActivitySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
