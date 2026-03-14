"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useDashboardMetrics } from "@/features/orders/hooks/useOrderMetrics";
import { DateRangeFilter } from "@/features/filters/components";
import { useDateFilterPreset } from "@/features/filters/stores";
import { formatCurrency } from "@/features/orders/utils/order-status.utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  // Client-side auth protection
  useAuthGuard();

  const user = useCurrentUser();
  const { data: metrics, isLoading } = useDashboardMetrics();
  const currentPreset = useDateFilterPreset();

  // Calcular tendencias para los indicadores
  const getTrend = (growth: number): "up" | "down" | "neutral" => {
    if (growth > 0) return "up";
    if (growth < 0) return "down";
    return "neutral";
  };

  const ordersTrend = metrics ? getTrend(metrics.ordersGrowth) : "neutral";
  const revenueTrend = metrics ? getTrend(metrics.revenueGrowth) : "neutral";

  // Formatear descripciones de tendencia
  const formatTrendDescription = (growth: number, label: string): string => {
    if (growth > 0) return `+${growth.toFixed(1)}% vs período anterior`;
    if (growth < 0) return `${growth.toFixed(1)}% vs período anterior`;
    return label;
  };

  // Labels dinámicos según el período seleccionado
  const getPeriodLabel = () => {
    switch (currentPreset) {
      case "today":
        return { orders: "Pedidos hoy", revenue: "Ingresos hoy" };
      case "yesterday":
        return { orders: "Pedidos ayer", revenue: "Ingresos ayer" };
      case "week":
      case "last7days":
        return { orders: "Pedidos (7 días)", revenue: "Ingresos (7 días)" };
      case "month":
        return { orders: "Pedidos (mes)", revenue: "Ingresos (mes)" };
      case "custom":
      default:
        return { orders: "Pedidos", revenue: "Ingresos" };
    }
  };

  const periodLabels = getPeriodLabel();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con título y filtro de fecha */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              ¡Hola, {user?.name || "Usuario"}!
            </h2>
            <p className="text-slate-500 mt-1">
              {user?.businessName ? (
                <>
                  Bienvenido a <span className="font-medium text-slate-700">{user.businessName}</span>. Aquí podrás gestionar tus pedidos y productos.
                </>
              ) : (
                "Bienvenido a tu dashboard. Aquí podrás gestionar tus pedidos y productos."
              )}
            </p>
          </div>

          {/* Filtro de fecha global */}
          <DateRangeFilter
            variant="default"
            showPresets={true}
            availablePresets={["today", "yesterday", "week", "last7days", "month", "custom"]}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title={periodLabels.orders}
                value={metrics?.ordersToday.toString() || "0"}
                description={
                  metrics && metrics.ordersToday > 0
                    ? `${metrics.ordersCompletedToday} completados`
                    : "Sin pedidos"
                }
                icon={ShoppingBagIcon}
                trend={ordersTrend}
                trendValue={metrics?.ordersGrowth}
              />
              <StatCard
                title={periodLabels.revenue}
                value={formatCurrency(metrics?.revenueToday || 0)}
                description={
                  metrics
                    ? formatTrendDescription(
                        metrics.revenueGrowth,
                        "Sin ventas"
                      )
                    : "Sin ventas"
                }
                icon={CurrencyIcon}
                trend={revenueTrend}
                trendValue={metrics?.revenueGrowth}
              />
              <StatCard
                title="Total órdenes"
                value={metrics?.totalOrders.toString() || "0"}
                description={
                  metrics
                    ? `${metrics.paidOrders} pagadas · ${metrics.pendingOrders} pendientes`
                    : "Sin órdenes"
                }
                icon={PackageIcon}
                trend="neutral"
              />
              <StatCard
                title="Ticket promedio"
                value={
                  metrics && metrics.paidOrders > 0
                    ? formatCurrency(metrics.revenueToday / metrics.paidOrders)
                    : formatCurrency(0)
                }
                description="Por orden pagada"
                icon={TrendingUpIcon}
                trend="neutral"
              />
            </>
          )}
        </div>

        {/* Recent activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Tus últimas acciones y pedidos aparecerán aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-400">
              <EmptyStateIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No hay actividad reciente</p>
              <p className="text-xs mt-1">
                Los pedidos y acciones aparecerán aquí
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Stat card component
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: "up" | "down" | "neutral";
  trendValue?: number;
}

function StatCard({ title, value, description, icon: Icon, trend, trendValue }: StatCardProps) {
  const trendColors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-slate-600 bg-slate-50",
  };

  const trendIcon = {
    up: "↑",
    down: "↓",
    neutral: "−",
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">{description}</p>
          </div>
          <div className={`p-3 rounded-xl flex-shrink-0 ml-3 ${trendColors[trend]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trendValue !== undefined && trend !== "neutral" && (
          <div className={`mt-3 text-xs font-medium ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}>
            {trendIcon[trend]} {Math.abs(trendValue).toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton para StatCard
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 mt-2" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// Icons
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function EmptyStateIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}
