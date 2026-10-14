"use client";
/**
 * Caja · Por liquidar (docs/caja-pos.md): efectivo de pedidos pagados que
 * aún no llega a caja. KPIs generales y un bloque plegable por persona
 * ("Domiciliario · Juan Pérez", cantidad de pedidos y total) con el detalle
 * pedido a pedido. "Liquidar" abre `SettleDrawer` (exige turno abierto y
 * `cash.operate`).
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bike, ChevronDown, Clock, Receipt, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCashDateFormat } from "../../utils/cash-time";
import { formatCOP } from "../../utils/cash.utils";
import { SettleDrawer } from "../SettleDrawer";
import type { CashCollection } from "../../types/cash.types";

interface SettlementsTabProps {
  businessId: string;
  branchId: string;
  collections: CashCollection[];
  /** Turno abierto de la caja elegida (null = no se puede liquidar). */
  session: { id: string; registerName: string } | null;
  canOperate: boolean;
}

interface HolderGroup {
  key: string;
  name: string;
  kind: CashCollection["holderKind"];
  total: number;
  since: string;
  items: CashCollection[];
}

const NO_HOLDER = "__none";

export function SettlementsTab({
  businessId,
  branchId,
  collections,
  session,
  canOperate,
}: SettlementsTabProps) {
  const t = useTranslations("cash");
  const fmt = useCashDateFormat();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const groups = useMemo<HolderGroup[]>(() => {
    const byHolder = new Map<string, HolderGroup>();
    for (const collection of collections) {
      const key = collection.holderUserId ?? NO_HOLDER;
      const group = byHolder.get(key) ?? {
        key,
        name: collection.holderName ?? t("pending.noHolder"),
        kind: collection.holderKind,
        total: 0,
        since: collection.collectedAt,
        items: [],
      };
      group.total += Number(collection.amount);
      if (collection.collectedAt < group.since)
        group.since = collection.collectedAt;
      group.items.push(collection);
      byHolder.set(key, group);
    }
    // Primero quien tiene más dinero.
    return [...byHolder.values()].sort((a, b) => b.total - a.total);
  }, [collections, t]);

  const total = groups.reduce((acc, group) => acc + group.total, 0);
  const oldest = collections.reduce<string | null>(
    (acc, item) => (!acc || item.collectedAt < acc ? item.collectedAt : acc),
    null
  );
  // Si otro cajero liquida al portador mientras el drawer está abierto, el
  // grupo desaparece y el drawer se cierra solo.
  const settling = groups.find((group) => group.key === settlingKey) ?? null;

  const toggle = (key: string) =>
    setCollapsed((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );

  const kpis = [
    {
      key: "total",
      variant: "metrics-amber" as const,
      icon: <Wallet className="h-5 w-5 text-amber-700" />,
      label: t("pos.settlements.kpiTotal"),
      value: formatCOP(total),
    },
    {
      key: "orders",
      variant: "metrics-blue" as const,
      icon: <Receipt className="h-5 w-5 text-blue-700" />,
      label: t("pos.settlements.kpiOrders"),
      value: collections.length,
    },
    {
      key: "holders",
      variant: "metrics-purple" as const,
      icon: <Users className="h-5 w-5 text-purple-700" />,
      label: t("pos.settlements.kpiHolders"),
      value: groups.length,
    },
    {
      key: "oldest",
      variant: "metrics-emerald" as const,
      icon: <Clock className="h-5 w-5 text-emerald-700" />,
      label: t("pos.settlements.kpiOldest"),
      value: oldest ? fmt.dateTime(oldest) : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.key} variant={kpi.variant}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {kpi.value}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                {kpi.icon}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {!session && collections.length > 0 && (
        <p className="text-sm text-amber-700">{t("pending.needOpen")}</p>
      )}

      {groups.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12 text-center text-sm text-slate-500">
            {t("collections.noPending")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3" data-testid="settlements-list">
          {groups.map((group) => {
            const open = !collapsed.includes(group.key);
            const role =
              group.kind === "DELIVERY"
                ? t("pos.settlements.delivery")
                : t("pos.settlements.operator");
            return (
              <li key={group.key}>
                <Card variant="glass">
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggle(group.key)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                          !open && "-rotate-90"
                        )}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Bike className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {group.key === NO_HOLDER
                            ? group.name
                            : `${role} · ${group.name}`}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {t("pos.settlements.holderMeta", {
                            count: group.items.length,
                            time: fmt.time(group.since),
                          })}
                        </span>
                      </span>
                    </button>
                    <span className="text-lg font-bold tabular-nums">
                      {formatCOP(group.total)}
                    </span>
                    {canOperate && session && (
                      <Button
                        size="sm"
                        onClick={() => setSettlingKey(group.key)}
                      >
                        {t("actions.settle")}
                      </Button>
                    )}
                  </div>
                  {open && (
                    <ul className="border-t border-slate-300/50">
                      {group.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="font-semibold text-slate-900">
                              #{item.order?.orderNumber ?? "—"}
                            </span>
                            <span className="ml-2 text-slate-500">
                              {[
                                item.order?.customerName,
                                item.order?.addressText,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="text-xs text-slate-500">
                              {fmt.time(item.collectedAt)}
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatCOP(item.amount)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {session && settling && (
        <SettleDrawer
          businessId={businessId}
          branchId={branchId}
          sessionId={session.id}
          registerName={session.registerName}
          holderName={settling.name}
          collections={settling.items}
          open
          onOpenChange={(open) => {
            if (!open) setSettlingKey(null);
          }}
        />
      )}
    </div>
  );
}
