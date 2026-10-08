"use client";
/**
 * Liquidación de recaudos: muestra el esperado (suma del servidor), pide
 * el contado recibido y el motivo si hay diferencia. El ajuste lo crea el
 * servidor con la misma `batchId` (docs/caja-pedidos.md).
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "./CurrencyInput";
import { useSettleCollections } from "../hooks/useCashMutations";
import { formatCOP } from "../utils/cash.utils";
import type { CashCollection } from "../types/cash.types";

interface SettleDrawerProps {
  businessId: string;
  branchId: string;
  sessionId: string;
  collections: CashCollection[];
  collectionIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettleDrawer({
  businessId,
  branchId,
  sessionId,
  collections,
  collectionIds,
  open,
  onOpenChange,
}: SettleDrawerProps) {
  const t = useTranslations("cash");
  const [received, setReceived] = useState(0);
  const [reason, setReason] = useState("");
  const settle = useSettleCollections(businessId, branchId, sessionId);

  const selected = useMemo(
    () => collections.filter((collection) => collectionIds.includes(collection.id)),
    [collections, collectionIds]
  );
  const expected = useMemo(
    () => selected.reduce((acc, collection) => acc + Number(collection.amount), 0),
    [selected]
  );
  const difference = received - expected;
  const needsReason = received > 0 && difference !== 0;

  const submit = () => {
    settle.mutate(
      {
        collectionIds,
        receivedAmount: received,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReceived(0);
          setReason("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {t("collections.settle")} ({selected.length})
          </DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("close.expected")}</span>
            <span className="font-semibold">{formatCOP(expected)}</span>
          </div>
          <div className="space-y-2">
            <label htmlFor="cash-settle-received" className="text-sm font-medium">
              {t("collections.received")}
            </label>
            <CurrencyInput
              id="cash-settle-received"
              value={received}
              onChange={setReceived}
            />
            {received > 0 && (
              <p className="text-xs text-slate-500">
                {t("collections.change")}: {formatCOP(Math.max(0, received - expected))}
                {difference !== 0 && (
                  <>
                    {" · "}
                    {t("close.difference")}: {formatCOP(difference)}
                  </>
                )}
              </p>
            )}
          </div>
          {needsReason && (
            <div className="space-y-2">
              <label htmlFor="cash-settle-reason" className="text-sm font-medium">
                {t("movements.reason")}
              </label>
              <Textarea
                id="cash-settle-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("movements.reasonPlaceholder")}
                rows={2}
              />
              <p className="text-xs text-slate-500">{t("collections.differenceHint")}</p>
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button
            onClick={submit}
            disabled={
              collectionIds.length === 0 ||
              received <= 0 ||
              (needsReason && !reason.trim()) ||
              settle.isPending
            }
          >
            {t("collections.settle")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
