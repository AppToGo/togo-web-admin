"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useActivateProduct,
  useDeactivateProduct,
  useUpdateInventory,
} from "@/features/branch-inventory/hooks/useBranchInventory";
import type { ProductVariant } from "@/features/catalog/types/catalog.types";

interface VariantBranchRowProps {
  businessId: string;
  branchId: string;
  variant: ProductVariant;
  inventoryItem: import("@/features/branch-inventory/types").InventoryItem | undefined;
}

export function VariantBranchRow({
  businessId,
  branchId,
  variant,
  inventoryItem,
}: VariantBranchRowProps) {
  const isActivated = !!inventoryItem;
  const [priceOverride, setPriceOverride] = useState(
    inventoryItem?.priceOverride?.toString() ?? ""
  );

  const prevItemRef = useRef(inventoryItem);
  useEffect(() => {
    if (inventoryItem !== prevItemRef.current) {
      prevItemRef.current = inventoryItem;
      setPriceOverride(inventoryItem?.priceOverride?.toString() ?? "");
    }
  }, [inventoryItem]);

  const activateMutation = useActivateProduct(businessId, branchId);
  const deactivateMutation = useDeactivateProduct(businessId, branchId);
  const updateMutation = useUpdateInventory(businessId, branchId);

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      activateMutation.mutate({
        productId: variant.id,
        data: { isAvailable: true },
      });
    } else {
      deactivateMutation.mutate(variant.id);
    }
  };

  const handleSavePrice = () => {
    if (!isActivated) return;
    const parsed = priceOverride ? parseFloat(priceOverride) : undefined;
    updateMutation.mutate({ productId: variant.id, data: { priceOverride: parsed } });
  };

  const isBusy =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    updateMutation.isPending;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white">
      <Switch
        checked={isActivated}
        onCheckedChange={handleToggle}
        disabled={isBusy}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-700 truncate">{variant.variantLabel}</span>
        {isActivated && inventoryItem?.effectivePrice != null && (
          <span className="text-xs text-slate-400 ml-2">
            efectivo: ${inventoryItem.effectivePrice}
          </span>
        )}
      </div>
      <span className="text-xs text-slate-400 shrink-0">${variant.price}</span>
      {isActivated && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-24">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
              $
            </span>
            <Input
              type="number"
              min={0}
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder="Precio"
              className="pl-5 h-8 text-xs"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2"
            onClick={handleSavePrice}
            disabled={isBusy}
          >
            {updateMutation.isPending ? "…" : "OK"}
          </Button>
        </div>
      )}
    </div>
  );
}
