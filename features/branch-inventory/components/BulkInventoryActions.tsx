"use client";

/**
 * BulkInventoryActions Component
 *
 * Barra de acciones masivas para productos seleccionados.
 * Permite activar, desactivar y ajustar stock en lote.
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Power, PowerOff, Plus, Minus, X, AlertTriangle } from "lucide-react";

interface BulkInventoryActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkActivate: (options: {
    defaultStock?: number;
    defaultIsAvailable: boolean;
  }) => void;
  onBulkDeactivate: () => void;
  onBulkAdjustStock: (adjustment: number) => void;
  isLoading?: boolean;
}

type BulkAction = "activate" | "deactivate" | "adjustStock" | null;

/** Botones de la barra flotante: translúcidos sobre el índigo oscuro. */
const BAR_BUTTON =
  "h-10 rounded-xl border-0 bg-white/15 px-3.5 text-sm font-medium text-white shadow-none hover:bg-white/25 hover:text-white";

export function BulkInventoryActions({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkAdjustStock,
  isLoading,
}: BulkInventoryActionsProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  const [activeAction, setActiveAction] = useState<BulkAction>(null);

  // Activate dialog state
  const [activateStock, setActivateStock] = useState<string>("");
  const [activateAvailable, setActivateAvailable] = useState(true);

  // Adjust stock dialog state
  const [stockAdjustment, setStockAdjustment] = useState<string>("");
  const [isIncrement, setIsIncrement] = useState(true);

  const handleClose = useCallback(() => {
    setActiveAction(null);
    setActivateStock("");
    setActivateAvailable(true);
    setStockAdjustment("");
    setIsIncrement(true);
  }, []);

  const handleActivate = useCallback(() => {
    onBulkActivate({
      defaultStock: activateStock ? parseInt(activateStock, 10) : undefined,
      defaultIsAvailable: activateAvailable,
    });
    handleClose();
  }, [onBulkActivate, activateStock, activateAvailable, handleClose]);

  const handleAdjustStock = useCallback(() => {
    const adjustment = parseInt(stockAdjustment, 10);
    if (!isNaN(adjustment) && adjustment > 0) {
      onBulkAdjustStock(isIncrement ? adjustment : -adjustment);
      handleClose();
    }
  }, [onBulkAdjustStock, stockAdjustment, isIncrement, handleClose]);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Action Bar */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div
            role="region"
            aria-label={t("bulk.label")}
            className="flex flex-wrap items-center gap-2 rounded-[20px] bg-indigo-950 py-2.5 pl-5 pr-2.5 text-white shadow-[0_12px_32px_rgba(49,46,129,0.3)]"
          >
            <span className="mr-1.5 text-sm font-semibold">
              {t("bulk.selected", { count: selectedCount })}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className={BAR_BUTTON}
                onClick={() => setActiveAction("activate")}
                disabled={isLoading}
              >
                <Power className="w-4 h-4 mr-1.5" />
                {t("bulk.activate")}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className={BAR_BUTTON}
                onClick={() => setActiveAction("deactivate")}
                disabled={isLoading}
              >
                <PowerOff className="w-4 h-4 mr-1.5" />
                {t("bulk.deactivate")}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className={BAR_BUTTON}
                onClick={() => setActiveAction("adjustStock")}
                disabled={isLoading}
              >
                <Package className="w-4 h-4 mr-1.5" />
                {t("bulk.adjustStock")}
              </Button>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label={t("bulk.clear")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Activate Dialog */}
      <Dialog
        open={activeAction === "activate"}
        onOpenChange={() => handleClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulk.activateTitle")}</DialogTitle>
            <DialogDescription>
              {t("bulk.activateDescription", { count: selectedCount })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activate-stock">{t("bulk.defaultStock")}</Label>
              <Input
                id="activate-stock"
                type="number"
                min={0}
                placeholder={t("bulk.stockPlaceholder")}
                value={activateStock}
                onChange={(e) => setActivateStock(e.target.value)}
              />
              <p className="text-xs text-slate-500">{t("bulk.stockHint")}</p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activate-available">
                {t("bulk.makeAvailable")}
              </Label>
              <Switch
                id="activate-available"
                checked={activateAvailable}
                onCheckedChange={setActivateAvailable}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {tc("buttons.cancel")}
            </Button>
            <Button onClick={handleActivate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {tc("buttons.processing")}
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  {t("bulk.confirmActivate", { count: selectedCount })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={activeAction === "deactivate"}
        onOpenChange={() => handleClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulk.deactivateTitle")}</DialogTitle>
            <DialogDescription>
              {t("bulk.deactivateDescription", { count: selectedCount })}
            </DialogDescription>
          </DialogHeader>

          <div className="px-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                {t("bulk.deactivateWarning")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {tc("buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onBulkDeactivate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {tc("buttons.processing")}
                </>
              ) : (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  {t("bulk.confirmDeactivate")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog
        open={activeAction === "adjustStock"}
        onOpenChange={() => handleClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulk.adjustStockTitle")}</DialogTitle>
            <DialogDescription>
              {t("bulk.adjustStockDescription", { count: selectedCount })}
            </DialogDescription>
          </DialogHeader>

          <div className="px-7">
            <div className="space-y-4 py-4">
              {/* Increment/Decrement toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isIncrement ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsIncrement(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("bulk.addStock")}
                </Button>
                <Button
                  type="button"
                  variant={!isIncrement ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsIncrement(false)}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  {t("bulk.removeStock")}
                </Button>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <Label htmlFor="stock-adjustment">{t("bulk.quantity")}</Label>
                <Input
                  id="stock-adjustment"
                  type="number"
                  min={1}
                  placeholder={t("bulk.quantityPlaceholder")}
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(e.target.value)}
                />
              </div>

              <p className="text-xs text-slate-500">
                {t("bulk.stockAdjustmentHint")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {tc("buttons.cancel")}
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={
                isLoading ||
                !stockAdjustment ||
                parseInt(stockAdjustment, 10) <= 0
              }
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {tc("buttons.processing")}
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  {t("bulk.confirmAdjustStock")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
