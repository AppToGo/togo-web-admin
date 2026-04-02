"use client";

/**
 * BulkActionBar Component
 * 
 * Barra flotante que aparece cuando hay productos seleccionados.
 * Permite realizar acciones masivas: activar, desactivar, ajustar stock.
 */

import { useTranslations } from "next-intl";
import { Power, PowerOff, Package, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  branchId: string | null;
  onActivate: () => void;
  onDeactivate: () => void;
  onAdjustStock: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  branchId,
  onActivate,
  onDeactivate,
  onAdjustStock,
  onClear,
  isLoading = false,
}: BulkActionBarProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "bg-white rounded-xl shadow-2xl border border-slate-200",
        "px-6 py-4 flex items-center gap-6",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Counter */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <Check className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">
            {t("bulkActions.selectedCount", { count: selectedCount })}
          </p>
          {branchId && (
            <p className="text-xs text-slate-500">
              {t("bulkActions.forBranch")}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-200" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onActivate}
          disabled={isLoading || !branchId}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          <Power className="w-4 h-4 mr-2" />
          {t("bulkActions.activate")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDeactivate}
          disabled={isLoading || !branchId}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <PowerOff className="w-4 h-4 mr-2" />
          {t("bulkActions.deactivate")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onAdjustStock}
          disabled={isLoading || !branchId}
        >
          <Package className="w-4 h-4 mr-2" />
          {t("bulkActions.adjustStock")}
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-200" />

      {/* Clear */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={isLoading}
        className="text-slate-500"
      >
        <X className="w-4 h-4 mr-2" />
        {tc("buttons.cancel")}
      </Button>
    </div>
  );
}
