"use client";
/**
 * Recorrido del dinero de un pedido en efectivo (docs/caja-pedidos.md).
 *
 * Muestra dónde está el efectivo (por liquidar en manos de alguien, o
 * liquidado en una caja) y, si está por liquidar, permite liquidarlo en
 * 1 clic contra un turno abierto de la sede, por el monto exacto del
 * pedido. Una liquidación con diferencia (faltante/sobrante) exige motivo
 * y se hace desde Caja (`SettleDrawer`), no desde acá. La colección se
 * resuelve por `orderId` desde las colecciones pendientes de la sede.
 */
import { useMemo, useState } from "react";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
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

  // Liquidar necesita ver los turnos (cash.view) y operar caja
  // (cash.operate): sin ellos no se piden esos datos (403 con reintentos) ni
  // se ofrece el botón.
  const { hasPermission } = useMyPermissions();
  const canSettle = hasPermission("cash.view") && hasPermission("cash.operate");

  const pending = collection?.status === "PENDING_SETTLEMENT";
  const branchId = pending && canSettle ? order.branchId : undefined;

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
    // Monto exacto de la custodia: sin diferencia no hace falta motivo.
    settle.mutate(
      { collectionIds: [mine.id], receivedAmount: Number(mine.amount) },
      { onSuccess: () => setSessionId(null) }
    );
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
