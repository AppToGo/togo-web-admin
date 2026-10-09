"use client";
/**
 * Lista "Por liquidar": recaudos PENDING_SETTLEMENT de la sede agrupados
 * por quien tiene el efectivo. Cada portador se liquida en un drawer
 * (gateado `cash.operate`, exige turno abierto).
 */
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatCOP } from "../utils/cash.utils";
import { SettleDrawer } from "./SettleDrawer";
import type { CashCollection } from "../types/cash.types";

interface PendingCollectionsPanelProps {
  businessId: string;
  branchId: string;
  sessionId: string | null;
  registerName: string;
  collections: CashCollection[];
  canOperate: boolean;
}

interface HolderGroup {
  key: string;
  name: string;
  total: number;
  since: string;
  items: CashCollection[];
}

const NO_HOLDER = "__none";

export function PendingCollectionsPanel({
  businessId,
  branchId,
  sessionId,
  registerName,
  collections,
  canOperate,
}: PendingCollectionsPanelProps) {
  const t = useTranslations("cash");
  const locale = useLocale();
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const groups = useMemo<HolderGroup[]>(() => {
    const byHolder = new Map<string, HolderGroup>();
    for (const collection of collections) {
      const key = collection.holderUserId ?? NO_HOLDER;
      const group = byHolder.get(key) ?? {
        key,
        name: collection.holderName ?? t("pending.noHolder"),
        total: 0,
        since: collection.collectedAt,
        items: [],
      };
      group.total += Number(collection.amount);
      if (collection.collectedAt < group.since) group.since = collection.collectedAt;
      group.items.push(collection);
      byHolder.set(key, group);
    }
    return [...byHolder.values()];
  }, [collections, t]);

  // Si otro cajero liquida al portador mientras el drawer está abierto, el
  // grupo desaparece y el drawer se cierra solo.
  const settling = groups.find((group) => group.key === settlingKey) ?? null;

  if (collections.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">{t("collections.noPending")}</p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {groups.map((group) => (
          <li
            key={group.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-white/80 bg-white/50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{group.name}</p>
              <p className="text-xs text-slate-500">
                {group.items
                  .map((item) => `#${item.order?.orderNumber ?? "—"}`)
                  .join(" · ")}
                {" · "}
                {new Date(group.since).toLocaleTimeString(locale, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums">
                {formatCOP(group.total)}
              </span>
              {canOperate && sessionId && (
                <Button size="sm" onClick={() => setSettlingKey(group.key)}>
                  {t("actions.settle")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {sessionId && settling && (
        <SettleDrawer
          businessId={businessId}
          branchId={branchId}
          sessionId={sessionId}
          registerName={registerName}
          holderName={settling.name}
          collections={settling.items}
          open
          onOpenChange={(open) => {
            if (!open) setSettlingKey(null);
          }}
        />
      )}
    </>
  );
}
