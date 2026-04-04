"use client";

/**
 * BranchInventoryManager Component
 *
 * Componente principal de gestión de inventario por sede.
 * Combina: selector de sede, tabla de inventario, acciones masivas y estadísticas.
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Store,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  useBranchInventory,
  useActivateProduct,
  useDeactivateProduct,
  useBulkActivate,
  useDebouncedInventoryUpdate,
  useUpdateStock,
  useSetAvailability,
} from "../hooks/useBranchInventory";
import { BranchInventoryTable } from "./BranchInventoryTable";
import { BulkInventoryActions } from "./BulkInventoryActions";
import type { InventoryItem, BranchSummary } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BranchInventoryManagerProps {
  readOnly?: boolean;
  businessId: string;
  branches: BranchSummary[];
}

// Stats card component
function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "danger";
  isLoading?: boolean;
}) {
  const variants = {
    default: "bg-slate-50 border-slate-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  };

  const iconVariants = {
    default: "text-slate-500",
    success: "text-green-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  };

  return (
    <Card className={cn("border", variants[variant])}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white", iconVariants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="text-xl font-semibold text-slate-900">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Activation dialog for new products
function ActivateProductDialog({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    stock?: number;
    isAvailable: boolean;
    priceOverride?: number;
  }) => void;
  product: InventoryItem | null;
  isLoading: boolean;
}) {
  const t = useTranslations("inventory");
  const [stock, setStock] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [priceOverride, setPriceOverride] = useState<string>("");

  const handleConfirm = useCallback(() => {
    onConfirm({
      stock: stock ? parseInt(stock, 10) : undefined,
      isAvailable,
      priceOverride: priceOverride ? parseFloat(priceOverride) : undefined,
    });
    setStock("");
    setIsAvailable(true);
    setPriceOverride("");
  }, [stock, isAvailable, priceOverride, onConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("activate.title")}</DialogTitle>
          <DialogDescription>
            {product &&
              t("activate.description", { name: product.productName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Price override */}
          <div className="space-y-2">
            <Label htmlFor="activate-price">
              {t("activate.priceOverride")}
            </Label>
            <div className="relative">
              <Input
                id="activate-price"
                type="number"
                min={0.01}
                step={0.01}
                placeholder={product?.basePrice.toString()}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
              {product && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {t("activate.basePrice", {
                    price: formatCurrency(product.basePrice),
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="activate-stock">{t("activate.stock")}</Label>
            <Input
              id="activate-stock"
              type="number"
              min={0}
              placeholder={t("activate.stockPlaceholder")}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between">
            <Label htmlFor="activate-available">
              {t("activate.available")}
            </Label>
            <Switch
              id="activate-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("activate.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {t("activate.processing")}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("activate.confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BranchInventoryManager({
  businessId,
  branches,
  readOnly = false,
}: BranchInventoryManagerProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  // State - initialize with main branch or first available branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const mainBranch = branches.find((b) => b.isMainBranch);
    return mainBranch?.id || branches[0]?.id || "";
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activatingProduct, setActivatingProduct] =
    useState<InventoryItem | null>(null);

  // Queries
  const {
    data: inventoryData,
    isLoading,
    refetch,
  } = useBranchInventory(businessId, selectedBranchId || null);

  // Mutations
  const activateMutation = useActivateProduct(businessId, selectedBranchId);
  const deactivateMutation = useDeactivateProduct(businessId, selectedBranchId);
  const bulkActivateMutation = useBulkActivate(businessId, selectedBranchId);
  const updateStockMutation = useUpdateStock(businessId, selectedBranchId);
  const setAvailabilityMutation = useSetAvailability(
    businessId,
    selectedBranchId
  );

  // Debounced update
  const { queueUpdate } = useDebouncedInventoryUpdate(
    businessId,
    selectedBranchId,
    useCallback(() => {
      // Optional: Show success toast for auto-save
    }, [])
  );

  // Derived data
  const items = inventoryData?.items || [];

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.isAvailable).length;
    const lowStock = items.filter(
      (i) => i.isAvailable && i.stock !== null && i.stock < 10
    ).length;
    const outOfStock = items.filter(
      (i) => i.isAvailable && i.stock === 0
    ).length;

    return { total, available, lowStock, outOfStock };
  }, [items]);

  // Selection handlers
  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Activation handlers
  const handleActivate = useCallback((product: InventoryItem) => {
    if (readOnly) return;
    setActivatingProduct(product);
  }, []);

  const handleConfirmActivate = useCallback(
    (data: {
      stock?: number;
      isAvailable: boolean;
      priceOverride?: number;
    }) => {
      if (!activatingProduct) return;

      activateMutation.mutate(
        {
          productId: activatingProduct.businessProductId,
          data,
        },
        {
          onSuccess: () => {
            setActivatingProduct(null);
          },
        }
      );
    },
    [activatingProduct, activateMutation]
  );

  const handleDeactivate = useCallback(
    (productId: string) => {
      deactivateMutation.mutate(productId);
    },
    [deactivateMutation]
  );

  // Bulk action handlers
  const handleBulkActivate = useCallback(
    (options: { defaultStock?: number; defaultIsAvailable: boolean }) => {
      const productIds = Array.from(selectedIds);
      bulkActivateMutation.mutate(
        {
          productIds,
          defaultStock: options.defaultStock,
          defaultIsAvailable: options.defaultIsAvailable,
        },
        {
          onSuccess: () => {
            handleClearSelection();
          },
        }
      );
    },
    [selectedIds, bulkActivateMutation, handleClearSelection]
  );

  const handleBulkDeactivate = useCallback(() => {
    // Deactivate products one by one (bulk delete not available in API)
    const productIds = Array.from(selectedIds);
    Promise.all(
      productIds.map((id) => deactivateMutation.mutateAsync(id))
    ).then(() => {
      handleClearSelection();
    });
  }, [selectedIds, deactivateMutation, handleClearSelection]);

  const handleBulkAdjustStock = useCallback(
    (adjustment: number) => {
      // Adjust stock for each selected product
      const productIds = Array.from(selectedIds);
      Promise.all(
        productIds.map((id) =>
          updateStockMutation.mutateAsync({
            productId: id,
            quantity: adjustment,
          })
        )
      ).then(() => {
        handleClearSelection();
      });
    },
    [selectedIds, updateStockMutation, handleClearSelection]
  );

  // Handle toggle availability
  const handleToggleAvailability = useCallback(
    (productId: string, isAvailable: boolean) => {
      setAvailabilityMutation.mutate({ productId, isAvailable });
    },
    [setAvailabilityMutation]
  );

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
            />
            {tc("buttons.refresh")}
          </Button>
        </div>
      </div>

      {/* Branch selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Store className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                {t("selectBranch")}
              </label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
              >
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder={t("branchPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <span>{branch.name}</span>
                        {branch.isMainBranch && (
                          <Badge variant="secondary" className="text-xs">
                            {t("mainBranch")}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {selectedBranchId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title={t("stats.total")}
            value={stats.total}
            icon={Package}
            isLoading={isLoading}
          />
          <StatCard
            title={t("stats.available")}
            value={stats.available}
            icon={CheckCircle}
            variant="success"
            isLoading={isLoading}
          />
          <StatCard
            title={t("stats.lowStock")}
            value={stats.lowStock}
            icon={AlertTriangle}
            variant={stats.lowStock > 0 ? "warning" : "default"}
            isLoading={isLoading}
          />
          <StatCard
            title={t("stats.outOfStock")}
            value={stats.outOfStock}
            icon={XCircle}
            variant={stats.outOfStock > 0 ? "danger" : "default"}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Inventory Table */}
      {selectedBranchId ? (
        <BranchInventoryTable
          data={items}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onToggleAvailability={handleToggleAvailability}
          debouncedUpdate={queueUpdate}
          readOnly={readOnly}
        />
      ) : (
        <Card className="p-12 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            {t("noBranch.title")}
          </h3>
          <p className="text-slate-500">{t("noBranch.message")}</p>
        </Card>
      )}

      {/* Bulk Actions */}
      <BulkInventoryActions
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkAdjustStock={handleBulkAdjustStock}
        isLoading={
          bulkActivateMutation.isPending ||
          deactivateMutation.isPending ||
          updateStockMutation.isPending
        }
      />

      {/* Activation Dialog */}
      <ActivateProductDialog
        isOpen={!!activatingProduct}
        onClose={() => setActivatingProduct(null)}
        onConfirm={handleConfirmActivate}
        product={activatingProduct}
        isLoading={activateMutation.isPending}
      />
    </div>
  );
}
