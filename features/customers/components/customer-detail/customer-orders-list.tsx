"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order } from "@/features/orders/types";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderDetailDialog } from "@/features/orders/components/OrderDetailDialog";

interface CustomerOrdersListProps {
  orders: Order[];
  totalCount: number;
}

/** Color de la etiqueta de pago; lo no cobrado en ámbar para que se vea. */
const PAYMENT_TAG: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-slate-200 text-slate-700",
  FAILED: "bg-slate-200 text-slate-700",
};

/**
 * Pedidos del cliente en tarjetas (antes una tabla): número y fecha, tipo de
 * entrega y método de pago, estado, pago y total. Tocar uno abre su detalle.
 */
export function CustomerOrdersList({ orders, totalCount }: CustomerOrdersListProps) {
  const t = useTranslations("customers");
  const to = useTranslations("orders");
  const format = useFormatter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <Package className="h-6 w-6 text-indigo-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">{t("detail.noOrders")}</h3>
        <p className="text-slate-500">{t("detail.noOrdersDescription")}</p>
      </div>
    );
  }

  const label = (key: string) => (to.has(key) ? to(key) : null);

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {orders.map((order) => {
          const details = [
            order.deliveryType ? label(`deliveryTypes.${order.deliveryType}`) : null,
            order.paymentMethod ? label(`paymentMethods.${order.paymentMethod}`) : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] border border-white/90 bg-white/65 px-4 py-3.5 text-left transition-colors hover:border-indigo-200 hover:bg-white"
              >
                <span className="flex min-w-40 flex-1 flex-col">
                  <span className="text-[15px] font-semibold text-slate-900">
                    #{order.orderNumber ?? order.id.slice(-6).toUpperCase()} ·{" "}
                    {format.dateTime(new Date(order.createdAt), {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  {details && (
                    <span className="text-[13px] text-slate-500">{details}</span>
                  )}
                </span>
                <OrderStatusBadge status={order.status} className="rounded-full" />
                {order.paymentStatus && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      PAYMENT_TAG[order.paymentStatus] ?? "bg-slate-200 text-slate-700"
                    )}
                  >
                    {label(`paymentStatus.${order.paymentStatus}`) ?? order.paymentStatus}
                  </span>
                )}
                <span className="min-w-24 text-right text-[15px] font-bold tabular-nums text-slate-900">
                  {formatCurrency(order.total ?? order.totalAmount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {totalCount > orders.length && (
        <p className="text-center text-sm text-slate-500">
          {t("detail.ordersTable.showing", {
            shown: orders.length,
            total: totalCount,
          })}
        </p>
      )}

      <OrderDetailDialog
        orderId={selectedOrderId || ""}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        isReadOnly={true}
      />
    </div>
  );
}
