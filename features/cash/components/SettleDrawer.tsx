"use client";
/**
 * Liquidación de un portador: lista sus pedidos pagados (todos marcados por
 * defecto), muestra lo que debe entregar, pide lo contado y el motivo si
 * hay diferencia. El ajuste lo crea el servidor (docs/caja-pedidos.md).
 */
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "./CurrencyInput";
import { useSettleCollections } from "../hooks/useCashMutations";
import { formatCOP } from "../utils/cash.utils";
import type { CashCollection } from "../types/cash.types";

interface SettleDrawerProps {
  businessId: string;
  branchId: string;
  sessionId: string;
  registerName: string;
  holderName: string;
  /** Recaudos pendientes del portador que se está liquidando. */
  collections: CashCollection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettleDrawer({
  businessId,
  branchId,
  sessionId,
  registerName,
  holderName,
  collections,
  open,
  onOpenChange,
}: SettleDrawerProps) {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");
  const locale = useLocale();
  const [excluded, setExcluded] = useState<string[]>([]);
  // `null` = aún no escribió: se asume que entrega exactamente lo esperado.
  const [typed, setTyped] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const settle = useSettleCollections(businessId, branchId, sessionId);

  const selected = useMemo(
    () => collections.filter((collection) => !excluded.includes(collection.id)),
    [collections, excluded]
  );
  const expected = useMemo(
    () => selected.reduce((acc, collection) => acc + Number(collection.amount), 0),
    [selected]
  );
  const received = typed ?? expected;
  const difference = received - expected;
  const needsReason = difference !== 0;

  const reset = () => {
    setExcluded([]);
    setTyped(null);
    setReason("");
  };

  const toggle = (id: string) => {
    setExcluded((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const submit = () => {
    settle.mutate(
      {
        collectionIds: selected.map((collection) => collection.id),
        receivedAmount: received,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      isLoading={settle.isPending}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("settleDrawer.title")}</DrawerTitle>
          <DrawerDescription>
            {t("settleDrawer.desc", { register: registerName })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("settleDrawer.holderOrders", { name: holderName })}
            </p>
            {collections.map((collection) => {
              const checked = !excluded.includes(collection.id);
              const id = `cash-settle-${collection.id}`;
              return (
                <label
                  key={collection.id}
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-card border px-4 py-3 transition-colors",
                    checked
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() => toggle(collection.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {t("settleDrawer.orderLine", {
                        number: collection.order?.orderNumber ?? "—",
                      })}
                    </span>
                    <span className="block text-xs text-slate-600">
                      {new Date(collection.collectedAt).toLocaleTimeString(locale, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {collection.order?.status
                        ? ` · ${tOrders(`status.${collection.order.status}`)}`
                        : ""}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {formatCOP(collection.amount)}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between rounded-card bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-600">
              {t("settleDrawer.mustDeliver")}
            </span>
            <span className="text-2xl font-bold tabular-nums">{formatCOP(expected)}</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="cash-settle-received" className="text-sm font-medium">
              {t("settleDrawer.counted")}
            </label>
            <CurrencyInput
              id="cash-settle-received"
              size="lg"
              value={received}
              onChange={setTyped}
              placeholder="0"
            />
          </div>

          <div
            className={cn(
              "rounded-card p-4 text-sm",
              difference === 0
                ? "bg-emerald-100 text-emerald-800"
                : difference < 0
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
            )}
          >
            <p className="font-semibold">
              {difference === 0
                ? t("settleDrawer.noDifference")
                : difference < 0
                  ? t("settleDrawer.shortage", { amount: formatCOP(-difference) })
                  : t("settleDrawer.surplus", { amount: formatCOP(difference) })}
            </p>
            <p className="text-xs">{t("collections.differenceHint")}</p>
          </div>

          {needsReason && (
            <div className="space-y-2">
              <label htmlFor="cash-settle-reason" className="text-sm font-medium">
                {t("settleDrawer.reason")}
              </label>
              <Textarea
                id="cash-settle-reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("movements.reasonPlaceholder")}
                rows={2}
              />
            </div>
          )}
        </div>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={
              selected.length === 0 ||
              received <= 0 ||
              (needsReason && !reason.trim()) ||
              settle.isPending
            }
          >
            {t("settleDrawer.confirm", {
              amount: formatCOP(received),
              register: registerName,
            })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
