"use client";
/**
 * Recorrido del dinero de un pedido en efectivo (docs/caja-pedidos.md).
 *
 * Muestra dónde está el efectivo (por liquidar en manos de alguien, o
 * liquidado en una caja) y, si está por liquidar, permite liquidarlo en
 * 1 clic contra un turno abierto de la sede. La colección se resuelve
 * por `orderId` desde las colecciones pendientes de la sede (sin pedir
 * el id de colección al backend).
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/features/cash/components/CurrencyInput";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import { useCollections, useOpenSessions } from "@/features/cash/hooks/useCash";
import { useSettleCollections } from "@/features/cash/hooks/useCashMutations";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import type { CashCollectionInfo } from "../types/order.types";

interface MoneyTrailBlockProps {
  order: {
    id: string;
    total: number;
    branchId?: string;
    cashCollection?: CashCollectionInfo;
  };
}

export function MoneyTrailBlock({ order }: MoneyTrailBlockProps) {
  const t = useTranslations("cash");
  const businessId = useEffectiveBusinessId();
  const collection = order.cashCollection;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [received, setReceived] = useState(0);

  const pending = collection?.status === "PENDING_SETTLEMENT";
  const branchId = pending ? order.branchId : undefined;

  const { data: collections = [] } = useCollections(
    businessId,
    branchId ?? null,
    "PENDING_SETTLEMENT"
  );
  const { data: openSessions = [] } = useOpenSessions(
    businessId,
    branchId ?? null
  );

  const mine = useMemo(
    () => collections.find((item) => item.orderId === order.id) ?? null,
    [collections, order.id]
  );
  const settle = useSettleCollections(
    businessId ?? "",
    branchId ?? "",
    sessionId ?? ""
  );

  if (!collection) return null;

  const submit = () => {
    if (!mine || !sessionId) return;
    settle.mutate({
      collectionIds: [mine.id],
      receivedAmount: received > 0 ? received : Number(mine.amount),
    });
  };

  return (
    <div className="space-y-3 rounded-card border border-slate-100 bg-white p-4">
      <h4 className="flex items-center gap-2 font-semibold text-slate-900">
        <Banknote className="h-4 w-4" />
        {t("orders.moneyTrail")}
      </h4>
      {collection.status === "SETTLED" && (
        <p className="text-sm text-slate-600">
          {t("movements.types.SETTLEMENT")}: {collection.registerName ?? "—"} ·{" "}
          {formatCOP(order.total)}
        </p>
      )}
      {pending && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {t("collections.holder")}: {collection.holderName ?? "—"} ·{" "}
            {formatCOP(order.total)}
          </p>
          {mine && openSessions.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="money-trail-session">{t("orders.destination")}</Label>
                <Select value={sessionId ?? undefined} onValueChange={setSessionId}>
                  <SelectTrigger id="money-trail-session">
                    <SelectValue placeholder={t("orders.destination")} />
                  </SelectTrigger>
                  <SelectContent>
                    {openSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.register.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="money-trail-received">{t("orders.tendered")}</Label>
                <CurrencyInput
                  id="money-trail-received"
                  value={received}
                  onChange={setReceived}
                  min={0}
                />
              </div>
              <Button
                size="sm"
                onClick={submit}
                disabled={!sessionId || settle.isPending}
              >
                {t("orders.settleOneClick")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
