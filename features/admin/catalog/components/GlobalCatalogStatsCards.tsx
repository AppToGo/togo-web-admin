"use client";

import * as React from "react";
import { Package, TrendingUp, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GlobalCatalogStats } from "../types/admin-catalog.types";

// ============================================================================
// TYPES
// ============================================================================

interface GlobalCatalogStatsCardsProps {
  stats?: GlobalCatalogStats;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlobalCatalogStatsCards({
  stats,
  isLoading,
}: GlobalCatalogStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const totalProducts = stats?.totalProducts || 0;
  const activeProducts = stats?.activeProducts || 0;
  const inactiveProducts = stats?.inactiveProducts || 0;
  const totalActivations = stats?.mostActivatedProducts.reduce(
    (sum, p) => sum + p.activationCount,
    0
  ) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Products */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Productos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{totalProducts}</p>
              <p className="text-xs text-slate-400 mt-1">
                {activeProducts} activos · {inactiveProducts} inactivos
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Products */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tasa de Activación</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {totalProducts > 0
                  ? Math.round((activeProducts / totalProducts) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-green-600 mt-1">
                {activeProducts} productos activos
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Activations */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Activaciones Totales</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {totalActivations.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                En todos los negocios
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Industry */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">Industria Principal</p>
              <p className="text-xl font-bold text-slate-900 mt-2 truncate">
                {stats?.productsByIndustry[0]?.industryName || "N/A"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stats?.productsByIndustry[0]?.count || 0} productos
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0 ml-3">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 mt-2" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
