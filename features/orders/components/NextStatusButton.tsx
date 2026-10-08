"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { Order, OrderStatus } from "../types";
import {
  BLOCKED_WHILE_CUSTOMER_EDITING,
  isCustomerEditing,
} from "../utils/order-status.utils";
import { getNextVisibleStatus } from "../utils/order-flow.utils";
import { useOrderFlow } from "../hooks/useOrderFlow";
import { HoverTooltip } from "./HoverTooltip";

// El botón ofrece el siguiente estado VISIBLE: si el negocio ocultó "En
// proceso", desde Nuevo pasa directo a "Marcar listo". Mover a otro estado
// (retroceder, cancelar) sigue siendo por arrastre entre columnas.
const LABEL_BY_TARGET: Partial<Record<OrderStatus, string>> = {
  IN_PROGRESS: "actions.toInProgress",
  READY: "actions.ready",
  COMPLETED: "actions.deliver",
};

interface NextStatusButtonProps {
  order: Order;
  status?: string;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

export function NextStatusButton({ order, status, onStatusChange }: NextStatusButtonProps) {
  const t = useTranslations("orders");
  const { visible } = useOrderFlow();
  const to = status ? getNextVisibleStatus(status as OrderStatus, visible) : null;
  const labelKey = to ? LABEL_BY_TARGET[to] : undefined;
  if (!to || !labelKey || !onStatusChange) return null;
  const next = { to, labelKey };

  // Mientras el cliente edita el pedido el backend rechaza mandarlo a
  // producción, así que el botón queda deshabilitado con la explicación.
  const blocked =
    isCustomerEditing(order) && BLOCKED_WHILE_CUSTOMER_EDITING.includes(next.to);

  const button = (
    <button
      type="button"
      disabled={blocked}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onStatusChange(order.id, next.to);
      }}
      className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-600"
    >
      {t(next.labelKey)}
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );

  if (!blocked) return button;

  return (
    <HoverTooltip content={t("card.customerEditingHint")}>
      <span>{button}</span>
    </HoverTooltip>
  );
}
