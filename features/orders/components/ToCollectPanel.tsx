"use client";
/**
 * Tab "Por cobrar" (docs/caja-pedidos.md): pedidos LIVE en efectivo con
 * pago pendiente, agrupados por mesa (DINE_IN con `tableLabel`) y el resto
 * por modalidad. Reutiliza `GET /orders` (vía `useOrdersByStatus`) con
 * filtro en cliente — no hay endpoint de receivables en el backend.
 * Cada fila cobra con `CashChargeDrawer` (destino del dinero explícito).
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";
import { useOrdersByStatus } from "../hooks/useOrders";
import { CashChargeDrawer, type ChargeableOrder } from "./CashChargeDrawer";
import { isCashPaymentMethod } from "@/features/cash/utils/cash.utils";

interface ToCollectPanelProps {
  // Los MISMOS filtros que el tablero: así el panel comparte su consulta
  // (una sola petición) y la refrescan los mismos eventos en tiempo real.
  businessId?: string;
  branchIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

const GROUP_LABELS = {
  DELIVERY: "deliveryTypes.DELIVERY",
  PICKUP: "deliveryTypes.PICKUP",
  DINE_IN: "deliveryTypes.DINE_IN",
  COUNTER: "deliveryTypes.COUNTER",
} as const;

export function ToCollectPanel({
  businessId,
  branchIds,
  dateFrom,
  dateTo,
}: ToCollectPanelProps) {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");
  const [collapsed, setCollapsed] = useState(false);
  const [charging, setCharging] = useState<ChargeableOrder | null>(null);

  // Antes se llamaba solo con `branchIds`: la key quedaba como
  // ['orders', undefined, 'live', …], distinta a la del tablero. Los eventos
  // en tiempo real no la invalidaban, los pedidos se pedían dos veces y a
  // un SUPER_ADMIN (consulta deshabilitada sin negocio) nunca le aparecía.
  const { orders = [] } = useOrdersByStatus({
    dateFrom,
    dateTo,
    businessId,
    branchIds,
  });

  const pending = useMemo(() => {
    return orders.filter(
      (order) =>
        order.paymentStatus === "PENDING" && isCashPaymentMethod(order.paymentMethod)
    );
  }, [orders]);

  const groups = useMemo(() => {
    const byKey = new Map<string, typeof pending>();
    for (const order of pending) {
      const key =
        order.deliveryType === "DINE_IN"
          ? order.tableLabel || "dineIn"
          : (order.deliveryType ?? "other");
      const list = byKey.get(key) ?? [];
      list.push(order);
      byKey.set(key, list);
    }
    return [...byKey.entries()];
  }, [pending]);

  if (pending.length === 0) return null;

  return (
    <Card data-testid="to-collect-panel">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4" />
          {t("collections.toCollect")} ({pending.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-4">
          {groups.map(([key, orders]) => (
            <div key={key} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {key === "dineIn"
                  ? tOrders("deliveryTypes.table")
                  : key in GROUP_LABELS
                    ? tOrders(GROUP_LABELS[key as keyof typeof GROUP_LABELS])
                    : key}
              </p>
              <ul className="divide-y rounded-md border border-slate-100">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span className="text-sm font-medium">
                      {formatOrderNumber(order.id, order.orderNumber)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatCurrency(order.total)}
                    </span>
                    <span className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCharging({
                          id: order.id,
                          total: order.total,
                          paymentMethod: order.paymentMethod,
                          branchId: order.branchId,
                        })
                      }
                    >
                      {t("orders.charge")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      )}
      <CashChargeDrawer
        order={charging}
        open={charging !== null}
        onOpenChange={(open) => {
          if (!open) setCharging(null);
        }}
      />
    </Card>
  );
}
