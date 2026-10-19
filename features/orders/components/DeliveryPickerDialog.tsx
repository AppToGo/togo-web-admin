"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeliveryCandidates } from "../hooks/useOrderFlow";

interface DeliveryPickerDialogProps {
  isOpen: boolean;
  /** Número del pedido para el título (ya formateado). */
  orderLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (deliveryUserId: string) => void;
}

/**
 * Elegir quién lleva el pedido al pasarlo a "En camino": el backend exige
 * repartidor para ese estado. Lista a los usuarios activos del negocio.
 */
export function DeliveryPickerDialog({
  isOpen,
  orderLabel,
  isSubmitting = false,
  onClose,
  onConfirm,
}: DeliveryPickerDialogProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const { data: candidates, isLoading, isError } = useDeliveryCandidates(isOpen);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    setSelectedId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("deliveryPicker.title")}</DialogTitle>
          <DialogDescription>
            {t("deliveryPicker.description", { order: orderLabel ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="p-7 space-y-2 max-h-80 overflow-y-auto">
          {isLoading && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
          {isError && <p className="text-sm text-red-600">{t("deliveryPicker.loadError")}</p>}
          {candidates?.length === 0 && (
            <p className="text-sm text-slate-500">{t("deliveryPicker.empty")}</p>
          )}
          {candidates?.map((candidate) => {
            const selected = candidate.id === selectedId;
            return (
              <button
                key={candidate.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedId(candidate.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-card border text-sm text-left transition-colors",
                  selected
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="truncate">{candidate.name}</span>
                {selected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {tc("buttons.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!selectedId}
            isLoading={isSubmitting}
            onClick={() => selectedId && onConfirm(selectedId)}
          >
            {t("deliveryPicker.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
