"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CancelOrderDialogProps {
  isOpen: boolean;
  /** Número del pedido para el título (ya formateado). */
  orderLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Motivo obligatorio al cancelar: sin motivo el pedido no se cancela y el
 * cliente no recibe el aviso con la razón. Lo usan el tablero y el detalle.
 */
export function CancelOrderDialog({
  isOpen,
  orderLabel,
  isSubmitting = false,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const [reason, setReason] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    setReason("");
    onClose();
  };

  const trimmed = reason.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("cancelDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("cancelDialog.description", { order: orderLabel ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="p-7 space-y-2">
          <Label htmlFor="cancel-order-reason">
            {t("cancelDialog.reasonLabel")}
          </Label>
          <Textarea
            id="cancel-order-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("cancelDialog.reasonPlaceholder")}
            maxLength={300}
            rows={3}
            disabled={isSubmitting}
            autoFocus
          />
          {!trimmed && (
            <p className="text-xs text-slate-500">
              {t("cancelDialog.reasonRequired")}
            </p>
          )}
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
            variant="destructive"
            disabled={isSubmitting || !trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            {t("cancelDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
