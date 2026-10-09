"use client";
/**
 * Chip del estado de pago (docs/caja-pedidos.md). Conserva el chip de
 * siempre; lo que cambia es qué abre:
 *
 * - PAID → chip estático.
 * - PENDING → abre `CashChargeDrawer` (método, paga-con/vueltas y destino
 *   del dinero). Ya no hay menú intermedio "Confirmar pago".
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryBadgeVariants } from "../styles";
import { PaymentMethodIcon } from "./PaymentMethodIcon";
import { CashChargeDrawer } from "./CashChargeDrawer";
import type { PaymentStatus } from "../types";

interface PaymentStatusEditorProps {
  orderId: string;
  total: number;
  branchId?: string;
  paymentMethod?: string;
  currentStatus: PaymentStatus;
  showMethodIcon?: boolean;
  /** Encabezado del drawer de pago: número de pedido, mesa, etc. */
  chargeLabel?: string;
}

export function PaymentStatusEditor({
  orderId,
  total,
  branchId,
  paymentMethod,
  currentStatus,
  showMethodIcon = true,
  chargeLabel,
}: PaymentStatusEditorProps) {
  const t = useTranslations("orders");
  const [chargeOpen, setChargeOpen] = useState(false);

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
    // El drawer se monta en un portal, pero los eventos de React suben por
    // el árbol de componentes: sin este contenedor cada clic dentro del
    // cobro también disparaba el onClick de la card y abría el detalle.
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setChargeOpen(true)}
        className={cn(
          categoryBadgeVariants({ variant: "amber" }),
          "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
        )}
      >
        {badgeContent}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      <CashChargeDrawer
        order={{ id: orderId, total, paymentMethod, branchId, label: chargeLabel }}
        open={chargeOpen}
        onOpenChange={setChargeOpen}
      />
    </div>
  );
}
