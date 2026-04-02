"use client";

/**
 * BranchAvailabilityTab Component
 * 
 * Tab para el formulario de producto que muestra la disponibilidad
 * del producto en todas las sedes del negocio.
 */

import { useTranslations } from "next-intl";
import { Store, Check, X, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { BranchAvailability } from "@/features/catalog/types/hybrid-catalog.types";

interface Branch {
  id: string;
  name: string;
  code: string;
  isMainBranch?: boolean;
}

interface BranchAvailabilityTabProps {
  productId: string;
  branches: Branch[];
  branchAvailability: BranchAvailability[];
  basePrice: number;
  onUpdate: (branchId: string, data: {
    isAvailable?: boolean;
    isAvailable?: boolean;
    stock?: number | null;
    priceOverride?: number | null;
  }) => void;
  isLoading?: boolean;
}

export function BranchAvailabilityTab({
  productId,
  branches,
  branchAvailability,
  basePrice,
  onUpdate,
  isLoading = false,
}: BranchAvailabilityTabProps) {
  const t = useTranslations("catalog");
  const ti = useTranslations("inventory");

  // Get availability info for a branch
  const getBranchAvailability = (branchId: string): BranchAvailability | undefined => {
    return branchAvailability.find((ba) => ba.branchId === branchId);
  };

  // Stock badge component
  function StockBadge({ stock }: { stock: number | null }) {
    if (stock === null) {
      return (
        <Badge variant="secondary" className="font-normal">
          ∞
        </Badge>
      );
    }

    if (stock === 0) {
      return (
        <Badge variant="destructive" className="font-normal">
          {ti("table.outOfStock")}
        </Badge>
      );
    }

    if (stock < 10) {
      return (
        <Badge
          variant="outline"
          className="font-normal bg-amber-50 text-amber-700 border-amber-200"
        >
          {stock}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="font-normal text-green-700 border-green-200">
        {stock}
      </Badge>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            {t("availabilityTab.noBranches")}
          </h3>
          <p className="text-slate-500">{t("availabilityTab.noBranchesDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-slate-900">
          {t("availabilityTab.title")}
        </h3>
        <p className="text-sm text-slate-500">
          {t("availabilityTab.description")}
        </p>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => {
          const availability = getBranchAvailability(branch.id);
          const isAvailable = availability?.isAvailable ?? false;
          const isAvailable = availability?.isAvailable ?? false;
          const stock = availability?.stock ?? null;
          const priceOverride = availability?.priceOverride ?? null;
          const effectivePrice = availability?.effectivePrice ?? basePrice;

          return (
            <Card
              key={branch.id}
              className={cn(
                "border transition-all",
                isAvailable
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50/50"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isAvailable
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">
                        {branch.name}
                      </CardTitle>
                      <CardDescription>
                        {branch.code}
                        {branch.isMainBranch && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {t("availabilityTab.mainBranch")}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {isAvailable ? t("availabilityTab.active") : t("availabilityTab.inactive")}
                    </span>
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={(checked) =>
                        onUpdate(branch.id, { isAvailable: checked })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardHeader>

              {isAvailable && (
                <CardContent className="pt-0 space-y-4">
                  {/* Stock */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-100">
                    <span className="text-sm text-slate-600">
                      {t("availabilityTab.stock")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="∞"
                        value={stock === null ? "" : stock}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
                          onUpdate(branch.id, { stock: value });
                        }}
                        disabled={isLoading}
                        className="w-20 h-8 text-sm"
                      />
                      <StockBadge stock={stock} />
                    </div>
                  </div>

                  {/* Price Override */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-100">
                    <span className="text-sm text-slate-600">
                      {t("availabilityTab.priceOverride")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder={String(basePrice)}
                        value={priceOverride === null ? "" : priceOverride}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseFloat(e.target.value);
                          onUpdate(branch.id, { priceOverride: value });
                        }}
                        disabled={isLoading}
                        className="w-24 h-8 text-sm"
                      />
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(effectivePrice)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
