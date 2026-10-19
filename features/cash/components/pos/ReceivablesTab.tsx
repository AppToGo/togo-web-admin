"use client";
/**
 * Caja · Por cobrar (docs/caja-pos.md): mesas y pedidos para recoger en
 * efectivo con pago pendiente. A la izquierda una tarjeta por mesa (todos
 * sus pedidos) o por pedido para recoger; a la derecha la cuenta elegida
 * con los productos de cada pedido.
 *
 * Se cobra pedido por pedido (`CashChargeDrawer`, el dinero entra al turno
 * abierto). "+ Agregar productos" abre Vender con la mesa elegida y crea un
 * pedido nuevo para ella: no se editan pedidos ya enviados a cocina.
 */
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Store, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CashChargeDrawer,
  type ChargeableOrder,
} from "@/features/orders/components/CashChargeDrawer";
import { useCashDateFormat } from "../../utils/cash-time";
import { formatCOP } from "../../utils/cash.utils";
import type { CashReceivable } from "../../types/cash.types";

interface ReceivableGroup {
  key: string;
  isTable: boolean;
  tableId: string | null;
  label: string;
  total: number;
  since: string;
  orders: CashReceivable[];
}

interface ReceivablesTabProps {
  branchId: string;
  receivables: CashReceivable[];
  /** Turno abierto de la caja elegida: el cobro entra ahí. */
  session: { id: string; registerName: string } | null;
  canCharge: boolean;
  /** "+ Agregar productos" a la mesa (null sin `order.create` o sin turno). */
  onAddToTable: ((tableId: string) => void) | null;
}

const orderNumber = (order: CashReceivable) =>
  order.orderNumber != null ? `#${order.orderNumber}` : "#—";

export function ReceivablesTab({
  branchId,
  receivables,
  session,
  canCharge,
  onAddToTable,
}: ReceivablesTabProps) {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");
  const fmt = useCashDateFormat();
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [charging, setCharging] = useState<ChargeableOrder | null>(null);

  const accountRef = useRef<HTMLDivElement>(null);
  /**
   * < lg la cuenta queda debajo de las tarjetas: al elegir una se lleva a
   * la vista para no tener que buscarla con scroll.
   */
  const pick = (key: string) => {
    setPickedKey(key);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        accountRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  };

  const groups = useMemo<ReceivableGroup[]>(() => {
    const byKey = new Map<string, ReceivableGroup>();
    for (const order of receivables) {
      const isTable = order.deliveryType === "DINE_IN";
      // Mesa: un grupo con todos sus pedidos. Recoger: uno por pedido.
      const key = isTable
        ? `table:${order.tableId ?? order.tableLabel ?? ""}`
        : `pickup:${order.id}`;
      const group = byKey.get(key) ?? {
        key,
        isTable,
        tableId: isTable ? order.tableId : null,
        label: isTable
          ? order.tableLabel
            ? t("pending.table", { name: order.tableLabel })
            : t("pending.tableGeneric")
          : `${orderNumber(order)} · ${order.customerName ?? t("pending.pickup")}`,
        total: 0,
        since: order.createdAt,
        orders: [],
      };
      group.total += Number(order.total);
      if (order.createdAt < group.since) group.since = order.createdAt;
      group.orders.push(order);
      byKey.set(key, group);
    }
    return [...byKey.values()];
  }, [receivables, t]);

  // Si otro cajero cobra la cuenta elegida, se pasa a la primera.
  const selected =
    groups.find((group) => group.key === pickedKey) ?? groups[0] ?? null;

  if (receivables.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-12 text-center text-sm text-slate-500">
          {t("collections.noPendingCollect")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]"
      data-testid="to-collect-panel"
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">{t("pending.collectHint")}</p>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const active = selected?.key === group.key;
            const Icon = group.isTable ? Utensils : Store;
            return (
              <li key={group.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => pick(group.key)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-card border p-4 text-left transition-colors",
                    active
                      ? "border-indigo-300 bg-indigo-50/80"
                      : "border-white/80 bg-white/60 hover:border-slate-200"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-icon",
                        group.isTable
                          ? "bg-cyan-100 text-cyan-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{group.label}</span>
                  </span>
                  <span className="text-xl font-bold tabular-nums text-slate-900">
                    {formatCOP(group.total)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t("pos.receivables.cardMeta", {
                      count: group.orders.length,
                      time: fmt.time(group.since),
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <Card ref={accountRef} variant="glass" className="scroll-mt-16 lg:sticky lg:top-4">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {selected.label}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("pos.receivables.ordersCount", {
                    count: selected.orders.length,
                  })}
                </p>
              </div>
              <span className="text-xl font-bold tabular-nums">
                {formatCOP(selected.total)}
              </span>
            </div>

            <ul className="space-y-3">
              {selected.orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-card border border-white/80 bg-white/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {orderNumber(order)}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {tOrders(`status.${order.status}`)} ·{" "}
                        {fmt.time(order.createdAt)}
                      </span>
                    </p>
                    <span className="text-sm font-bold tabular-nums">
                      {formatCOP(order.total)}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex gap-2 text-slate-600">
                        <span className="w-7 shrink-0 text-slate-400">
                          {item.quantity}x
                        </span>
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="tabular-nums">
                          {formatCOP(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {canCharge && (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() =>
                        setCharging({
                          id: order.id,
                          total: Number(order.total),
                          paymentMethod: order.paymentMethod ?? undefined,
                          branchId,
                          label: `${orderNumber(order)} · ${selected.label}`,
                        })
                      }
                    >
                      {t("pos.receivables.charge", {
                        number: orderNumber(order),
                        total: formatCOP(order.total),
                      })}
                    </Button>
                  )}
                </li>
              ))}
            </ul>

            {selected.isTable && selected.tableId && onAddToTable && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onAddToTable(selected.tableId!)}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("pos.receivables.addProducts")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
