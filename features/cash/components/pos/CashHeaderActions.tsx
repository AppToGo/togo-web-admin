"use client";
/**
 * Acciones del turno (Movimiento, Cerrar caja / Abrir caja) junto al título
 * de la página "Caja". `CashPosPage` las registra en
 * `usePosHeaderActionsStore` mientras está montada; fuera de ella (o sin
 * permiso) no se pinta nada.
 */
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosHeaderActionsStore } from "@/stores/pos-menu.store";

export function CashHeaderActions() {
  const t = useTranslations("cash");
  const actions = usePosHeaderActionsStore((state) => state.actions);
  if (!actions) return null;
  const { onMovement, onCloseRegister, onOpenRegister } = actions;
  if (!onMovement && !onCloseRegister && !onOpenRegister) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {onMovement && (
        <Button variant="outline" onClick={onMovement}>
          <ArrowLeftRight className="mr-1 h-4 w-4" />
          {t("pos.header.movement")}
        </Button>
      )}
      {onCloseRegister && (
        <Button variant="slate" onClick={onCloseRegister}>
          <Lock className="mr-1 h-4 w-4" />
          {t("actions.closeRegister")}
        </Button>
      )}
      {onOpenRegister && (
        <Button variant="slate" onClick={onOpenRegister}>
          {t("actions.openRegister")}
        </Button>
      )}
    </div>
  );
}
