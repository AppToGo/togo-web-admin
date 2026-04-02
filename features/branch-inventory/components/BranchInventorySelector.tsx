"use client";

/**
 * BranchInventorySelector Component
 * 
 * Componente para seleccionar sedes al crear/editar un producto.
 * Permite configurar disponibilidad, stock y precio por sucursal.
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/features/branches/types";

export interface InitialInventoryConfig {
  branchId: string;
  branchName: string;
  isAvailable: boolean;
  priceOverride?: number;
  stock?: number;
}

interface BranchInventorySelectorProps {
  branches: Branch[];
  basePrice: number;
  value: InitialInventoryConfig[];
  onChange: (inventory: InitialInventoryConfig[]) => void;
}

export function BranchInventorySelector({
  branches,
  basePrice,
  value,
  onChange,
}: BranchInventorySelectorProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  // Track selected branch IDs for quick lookup
  const selectedBranchIds = new Set(value.map((v) => v.branchId));

  const handleToggleBranch = useCallback(
    (branch: Branch, checked: boolean) => {
      if (checked) {
        // Add branch with defaults
        onChange([
          ...value,
          {
            branchId: branch.id,
            branchName: branch.name,
            isAvailable: true,
            priceOverride: undefined,
            stock: undefined,
          },
        ]);
      } else {
        // Remove branch
        onChange(value.filter((v) => v.branchId !== branch.id));
      }
    },
    [value, onChange]
  );

  const handleUpdateConfig = useCallback(
    (branchId: string, updates: Partial<InitialInventoryConfig>) => {
      onChange(
        value.map((v) =>
          v.branchId === branchId ? { ...v, ...updates } : v
        )
      );
    },
    [value, onChange]
  );

  const handleSelectAll = useCallback(() => {
    const allSelected = branches.every((b) => selectedBranchIds.has(b.id));
    if (allSelected) {
      // Deselect all
      onChange([]);
    } else {
      // Select all branches
      const newConfigs: InitialInventoryConfig[] = branches.map((branch) => {
        const existing = value.find((v) => v.branchId === branch.id);
        return (
          existing || {
            branchId: branch.id,
            branchName: branch.name,
            isAvailable: true,
            priceOverride: undefined,
            stock: undefined,
          }
        );
      });
      onChange(newConfigs);
    }
  }, [branches, value, selectedBranchIds, onChange]);

  if (branches.length === 0) {
    return (
      <Card variant="bordered" className="p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-slate-600">{t("selector.noBranches")}</p>
      </Card>
    );
  }

  const allSelected = branches.length > 0 && branches.every((b) => selectedBranchIds.has(b.id));

  return (
    <div className="space-y-4">
      {/* Header with select all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            {t("selector.title")}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {allSelected ? tc("buttons.deselectAll") : tc("buttons.selectAll")}
        </Button>
      </div>

      {/* Warning if no branches selected */}
      {value.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">{t("selector.noSelectionWarning")}</p>
        </div>
      )}

      {/* Branches list */}
      <div className="space-y-3">
        {branches.map((branch) => {
          const config = value.find((v) => v.branchId === branch.id);
          const isSelected = !!config;

          return (
            <Card
              key={branch.id}
              className={cn(
                "transition-all duration-200",
                isSelected
                  ? "border-indigo-200 bg-indigo-50/30"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <CardContent className="p-4 space-y-4">
                {/* Branch header with checkbox */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`branch-${branch.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleToggleBranch(branch, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`branch-${branch.id}`}
                      className="font-medium text-slate-900 cursor-pointer"
                    >
                      {branch.name}
                      {branch.isMainBranch && (
                        <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                          {t("selector.mainBranch")}
                        </span>
                      )}
                    </Label>
                  </div>

                  {/* Availability toggle (only when selected) */}
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {t("selector.available")}
                      </span>
                      <Switch
                        checked={config.isAvailable}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig(branch.id, { isAvailable: checked })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Configuration fields (only when selected) */}
                {isSelected && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    {/* Price override */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`price-${branch.id}`}
                        className="text-xs text-slate-500 flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        {t("selector.priceOverride")}
                        <span className="text-slate-400">({t("selector.optional")})</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={`price-${branch.id}`}
                          type="number"
                          min={0.01}
                          step={0.01}
                          placeholder={basePrice.toString()}
                          value={config.priceOverride ?? ""}
                          onChange={(e) =>
                            handleUpdateConfig(branch.id, {
                              priceOverride: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          className="h-8 text-sm"
                        />
                        {config.priceOverride && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            vs {basePrice}
                          </div>
                        )}
                      </div>
                      {config.priceOverride && config.priceOverride < basePrice && (
                        <p className="text-xs text-green-600">
                          {t("selector.discount", {
                            amount: (basePrice - config.priceOverride).toFixed(2),
                          })}
                        </p>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`stock-${branch.id}`}
                        className="text-xs text-slate-500 flex items-center gap-1"
                      >
                        <Package className="w-3 h-3" />
                        {t("selector.stock")}
                        <span className="text-slate-400">({t("selector.optional")})</span>
                      </Label>
                      <Input
                        id={`stock-${branch.id}`}
                        type="number"
                        min={0}
                        step={1}
                        placeholder={t("selector.noStockControl")}
                        value={config.stock ?? ""}
                        onChange={(e) =>
                          handleUpdateConfig(branch.id, {
                            stock: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          })
                        }
                        className="h-8 text-sm"
                      />
                      {config.stock !== undefined && (
                        <p className="text-xs text-slate-500">
                          {config.stock === 0
                            ? t("selector.outOfStock")
                            : t("selector.inStock", { count: config.stock })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {value.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
          <Store className="w-4 h-4" />
          <span>
            {t("selector.summary", {
              count: value.length,
              available: value.filter((v) => v.isAvailable).length,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
