"use client";
/**
 * Editor compartido del estado de pago (docs/caja-pedidos.md).
 * Reemplaza los dropdowns duplicados de `OrderCard` y
 * `OrderDetailContent` con una sola implementación:
 *
 * - PAID → badge estático.
 * - PENDING + efectivo → abre `CashChargeDrawer` (paga-con/vueltas y
 *   destino: liquidar en turno o dejar por liquidar).
 * - PENDING + otro método → confirmación en 1 clic (no mueve caja).
 */
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { categoryBadgeVariants } from "../styles";
import { PaymentMethodIcon } from "./PaymentMethodIcon";
import { CashChargeDrawer } from "./CashChargeDrawer";
import { useUpdateOrderPaymentStatus } from "../hooks/useOrders";
import { isCashPaymentMethod } from "@/features/cash/utils/cash.utils";
import type { PaymentStatus } from "../types";

interface PaymentStatusEditorProps {
  orderId: string;
  total: number;
  branchId?: string;
  paymentMethod?: string;
  currentStatus: PaymentStatus;
  showMethodIcon?: boolean;
}

export function PaymentStatusEditor({
  orderId,
  total,
  branchId,
  paymentMethod,
  currentStatus,
  showMethodIcon = true,
}: PaymentStatusEditorProps) {
  const t = useTranslations("orders");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const updatePaymentStatus = useUpdateOrderPaymentStatus();

  const handleSelect = useCallback(
    (newStatus: PaymentStatus) => {
      if (newStatus === currentStatus) {
        setMenuOpen(false);
        return;
      }
      // Efectivo pendiente se cobra con destino explícito; el resto es
      // solo confirmación (transfer/datáfono no mueven caja).
      if (newStatus === "PAID" && isCashPaymentMethod(paymentMethod)) {
        setMenuOpen(false);
        setChargeOpen(true);
        return;
      }
      updatePaymentStatus.mutate({
        orderId,
        data: {
          paymentStatus: newStatus,
          changeNotes: t("paymentNotes.confirmedFromAdmin"),
        },
      });
      setMenuOpen(false);
    },
    [currentStatus, orderId, paymentMethod, updatePaymentStatus, t]
  );

  const badgeContent = (
    <>
      {showMethodIcon && <PaymentMethodIcon method={paymentMethod} />}
      <span>{t(`paymentStatus.${currentStatus}`)}</span>
    </>
  );

  if (currentStatus === "PAID") {
    return (
      <span
        className={cn(
          categoryBadgeVariants({ variant: "green" }),
          "flex items-center gap-1"
        )}
      >
        {badgeContent}
      </span>
    );
  }

  return (
    <>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                categoryBadgeVariants({ variant: "amber" }),
                "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
              )}
            >
              {badgeContent}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[140px] z-[9999]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              onSelect={() => handleSelect("PAID")}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-slate-700">{t("actions.confirmPayment")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/*
        El drawer se monta en un portal, pero los eventos de React suben por
        el árbol de componentes: sin este contenedor cada clic dentro del
        cobro (radio, turno, monto, "Cobrar") también disparaba el onClick
        de la card y abría el detalle del pedido encima.
      */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <CashChargeDrawer
          order={{ id: orderId, total, paymentMethod, branchId }}
          open={chargeOpen}
          onOpenChange={setChargeOpen}
        />
      </div>
    </>
  );
}
