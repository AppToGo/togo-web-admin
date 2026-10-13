"use client";
/**
 * Lista "Por cobrar" de Caja (docs/caja-pedidos.md): pedidos en efectivo de
 * mesa y para recoger con pago pendiente, en cualquier estado activo
 * (incluidos los ya entregados), agrupados por mesa con el total del grupo.
 * Cada fila cobra con `CashChargeDrawer`; con un turno abierto el dinero
 * entra directo a esa caja.
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryBadgeVariants } from "@/features/orders/styles";
import {
  CashChargeDrawer,
  type ChargeableOrder,
} from "@/features/orders/components/CashChargeDrawer";
import { formatCOP } from "../utils/cash.utils";
import type { CashReceivable } from "../types/cash.types";

interface ReceivableGroup {
  key: string;
  isTable: boolean;
  label: string;
  total: number;
  orders: CashReceivable[];
}

interface ReceivablesPanelProps {
  branchId: string;
  receivables: CashReceivable[];
  /** Turno abierto de la caja visible: el cobro entra ahí. */
  session?: { id: string; registerName: string } | null;
  canCharge: boolean;
}

export function ReceivablesPanel({
  branchId,
  receivables,
  session,
  canCharge,
}: ReceivablesPanelProps) {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");
  const [charging, setCharging] = useState<ChargeableOrder | null>(null);

  const groups = useMemo<ReceivableGroup[]>(() => {
    const byKey = new Map<string, ReceivableGroup>();
    for (const order of receivables) {
      const isTable = order.deliveryType === "DINE_IN";
      const key = isTable ? `table:${order.tableLabel ?? ""}` : "pickup";
      const group = byKey.get(key) ?? {
        key,
        isTable,
        label: isTable
          ? order.tableLabel
            ? t("pending.table", { name: order.tableLabel })
            : t("pending.tableGeneric")
          : t("pending.pickup"),
        total: 0,
        orders: [],
      };
      group.total += Number(order.total);
      group.orders.push(order);
      byKey.set(key, group);
    }
    return [...byKey.values()];
  }, [receivables, t]);

  if (receivables.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        {t("collections.noPendingCollect")}
      </p>
    );
  }

  return (
    <div data-testid="to-collect-panel">
      <ul className="space-y-3">
        {groups.map((group) => (
          <li
            key={group.key}
            className="overflow-hidden rounded-card border border-white/80 bg-white/50"
          >
            <div className="flex items-center justify-between border-b border-slate-300/50 px-4 py-2.5">
              <span
                className={cn(
                  categoryBadgeVariants({ variant: group.isTable ? "cyan" : "amber" }),
                  "text-xs"
                )}
              >
                {group.label}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {formatCOP(group.total)}
              </span>
            </div>
            <ul>
              {group.orders.map((order) => {
                const number = order.orderNumber != null ? `#${order.orderNumber}` : "#—";
                return (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {number} · {formatCOP(order.total)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[
                          group.isTable ? null : order.customerName,
                          tOrders(`status.${order.status}`),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {canCharge && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setCharging({
                            id: order.id,
                            total: Number(order.total),
                            paymentMethod: order.paymentMethod ?? undefined,
                            branchId,
                            label: `${number} · ${group.label}`,
                          })
                        }
                      >
                        {t("orders.charge")}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      <CashChargeDrawer
        order={charging}
        open={charging !== null}
        fixedSession={session ?? undefined}
        onOpenChange={(open) => {
          if (!open) setCharging(null);
        }}
      />
    </div>
  );
}
