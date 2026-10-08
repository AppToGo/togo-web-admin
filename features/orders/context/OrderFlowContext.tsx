"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import type { VisibleStatuses } from "../utils/order-flow.utils";

export const ORDER_REVERT_STATUS_PERMISSION = "order.revert_status";

/**
 * Columnas visibles del tablero, para que la card, la lista y el detalle
 * calculen el siguiente estado igual que el tablero. Fuera del tablero (ej.
 * detalle desde la ficha del cliente) no hay provider: todas visibles.
 */
const OrderFlowContext = createContext<VisibleStatuses>(null);

export function OrderFlowProvider({
  visible,
  children,
}: {
  visible: VisibleStatuses;
  children: ReactNode;
}) {
  return <OrderFlowContext.Provider value={visible}>{children}</OrderFlowContext.Provider>;
}

/** Columnas visibles y si el usuario puede devolver pedidos a un estado anterior. */
export function useOrderFlow(): { visible: VisibleStatuses; canRevert: boolean } {
  const visible = useContext(OrderFlowContext);
  const { hasPermission } = useMyPermissions();
  const canRevert = hasPermission(ORDER_REVERT_STATUS_PERMISSION);
  return useMemo(() => ({ visible, canRevert }), [visible, canRevert]);
}
