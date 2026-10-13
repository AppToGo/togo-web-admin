"use client";
/**
 * Recorrido del dinero de un pedido en efectivo (docs/caja-pedidos.md).
 *
 * Línea de tiempo: el cliente pagó → quién tiene el efectivo → entrada a
 * caja. Si está por liquidar, un botón lo liquida en 1 clic contra el turno
 * abierto de la sede, por el monto exacto del pedido. Una liquidación con
 * diferencia (faltante/sobrante) exige motivo y se hace desde Caja
 * (`SettleDrawer`), no desde acá. La colección se resuelve por `orderId`
 * desde las colecciones pendientes de la sede.
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
import { cn } from "@/lib/utils";
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

function Step({
  tone,
  title,
  detail,
}: {
  tone: "done" | "current" | "todo";
  title: string;
  detail?: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          tone === "done" && "bg-emerald-600",
          tone === "current" && "bg-orange-600",
          tone === "todo" && "border-2 border-slate-400"
        )}
      />
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            tone === "todo" ? "text-slate-600" : "text-slate-900"
          )}
        >
          {title}
        </p>
        {detail && <p className="text-xs text-slate-500">{detail}</p>}
      </div>
    </li>
  );
}

export function MoneyTrailBlock({ order }: MoneyTrailBlockProps) {
  const t = useTranslations("cash");
  const businessId = useEffectiveBusinessId();
  const collection = order.cashCollection;

  const [pickedSessionId, setSessionId] = useState<string | null>(null);

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
  // Con un solo turno abierto no hay nada que elegir: 1 clic.
  const sessionId =
    pickedSessionId && openSessions.some((session) => session.id === pickedSessionId)
      ? pickedSessionId
      : (openSessions[0]?.id ?? null);
  const registerName =
    openSessions.find((session) => session.id === sessionId)?.register.name ?? "";
  const settle = useSettleCollections(
    businessId ?? "",
    branchId ?? "",
    sessionId ?? ""
  );

  if (!collection || collection.status === "VOIDED") return null;

  const amount = formatCOP(mine?.amount ?? order.total);

  const submit = () => {
    if (!mine || !sessionId) return;
    // Monto exacto de la custodia: sin diferencia no hace falta motivo.
    settle.mutate({ collectionIds: [mine.id], receivedAmount: Number(mine.amount) });
  };

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-semibold text-slate-900">
        <Banknote className="h-4 w-4" />
        {t("orders.moneyTrail")}
      </h4>
      <div className="space-y-4 rounded-card bg-slate-50 p-4">
        <ol className="space-y-3">
          <Step tone="done" title={t("trail.paid", { amount })} />
          {pending && (
            <Step
              tone="current"
              title={t("trail.heldBy", {
                name: collection.holderName ?? t("pending.noHolder"),
              })}
              detail={t("trail.pendingSettle")}
            />
          )}
          <Step
            tone={pending ? "todo" : "done"}
            title={
              pending
                ? t("trail.entry")
                : t("trail.entryDone", { register: collection.registerName ?? "—" })
            }
            detail={pending ? t("trail.entryPending") : undefined}
          />
        </ol>

        {pending && canSettle && mine && (
          openSessions.length === 0 ? (
            <p className="text-xs text-amber-700">{t("trail.noOpen")}</p>
          ) : (
            <div className="space-y-2">
              {openSessions.length > 1 && (
                <Select value={sessionId ?? undefined} onValueChange={setSessionId}>
                  <SelectTrigger aria-label={t("charge.chooseRegister")}>
                    <SelectValue placeholder={t("charge.chooseRegister")} />
                  </SelectTrigger>
                  <SelectContent>
                    {openSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.register.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                className="w-full"
                onClick={submit}
                disabled={!sessionId || settle.isPending}
              >
                {t("trail.settleIn", { register: registerName })}
              </Button>
              <p className="text-center text-xs text-slate-500">
                {t("trail.settleHint", { amount, register: registerName })}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
