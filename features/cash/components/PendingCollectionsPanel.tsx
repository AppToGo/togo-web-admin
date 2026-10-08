"use client";
/**
 * Panel "Por liquidar": recaudos PENDING_SETTLEMENT de la sede con
 * selección múltiple y liquidación (gateada `cash.operate`).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCOP } from "../utils/cash.utils";
import { SettleDrawer } from "./SettleDrawer";
import type { CashCollection } from "../types/cash.types";

interface PendingCollectionsPanelProps {
  businessId: string;
  branchId: string;
  sessionId: string | null;
  collections: CashCollection[];
  canOperate: boolean;
}

export function PendingCollectionsPanel({
  businessId,
  branchId,
  sessionId,
  collections,
  canOperate,
}: PendingCollectionsPanelProps) {
  const t = useTranslations("cash");
  const [selected, setSelected] = useState<string[]>([]);
  const [settling, setSettling] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {t("collections.toSettle")} ({collections.length})
        </CardTitle>
        {canOperate && sessionId && selected.length > 0 && (
          <Button size="sm" onClick={() => setSettling(true)}>
            {t("collections.settleSelected")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">{t("collections.noPending")}</p>
        ) : (
          <ul className="divide-y">
            {collections.map((collection) => (
              <li key={collection.id} className="flex items-center gap-3 py-2">
                {canOperate && sessionId && (
                  <Checkbox
                    checked={selected.includes(collection.id)}
                    onCheckedChange={() => toggle(collection.id)}
                    aria-label={`${t("collections.settle")} #${collection.order?.orderNumber ?? collection.orderId}`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {t("collections.order")} #
                    {collection.order?.orderNumber ?? "—"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {t("collections.holder")}: {collection.holderName ?? "—"}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatCOP(collection.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {sessionId && (
        <SettleDrawer
          businessId={businessId}
          branchId={branchId}
          sessionId={sessionId}
          collections={collections}
          collectionIds={selected}
          open={settling}
          onOpenChange={(open) => {
            setSettling(open);
            if (!open) setSelected([]);
          }}
        />
      )}
    </Card>
  );
}
