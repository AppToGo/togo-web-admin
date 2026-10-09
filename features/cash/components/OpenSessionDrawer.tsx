"use client";
/**
 * Apertura de turno: monto inicial contado (>= 0) + referencia del último
 * cierre de ESTA caja (monto, fecha y quién cerró). El cierre se pide acá,
 * filtrado por caja y solo al abrir el panel.
 */
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { CurrencyInput } from "./CurrencyInput";
import { useOpenSession } from "../hooks/useCashMutations";
import { useSessionsHistory } from "../hooks/useCash";
import { formatCOP } from "../utils/cash.utils";
import type { CashRegister } from "../types/cash.types";

interface OpenSessionDrawerProps {
  businessId: string;
  branchId: string;
  register: CashRegister | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpened?: (sessionId: string) => void;
}

export function OpenSessionDrawer({
  businessId,
  branchId,
  register,
  open,
  onOpenChange,
  onOpened,
}: OpenSessionDrawerProps) {
  const t = useTranslations("cash");
  const locale = useLocale();
  const user = useCurrentUser();
  const [openingAmount, setOpeningAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const openSession = useOpenSession(businessId, branchId);
  const { data: closedPage, isLoading: isLoadingLastClosed } = useSessionsHistory(
    open && register ? businessId : null,
    branchId,
    { page: 1, limit: 1, status: "CLOSED", cashRegisterId: register?.id }
  );
  const lastClosed = closedPage?.items[0] ?? null;

  const submit = () => {
    if (!register) return;
    openSession.mutate(
      {
        cashRegisterId: register.id,
        openingAmount,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (session) => {
          setOpeningAmount(0);
          setNotes("");
          onOpenChange(false);
          onOpened?.(session.id);
        },
      }
    );
  };

  const lastCloseText = isLoadingLastClosed
    ? "…"
    : lastClosed?.closedAt
      ? t("openDrawer.lastCloseDetail", {
          amount: formatCOP(lastClosed.countedAmount ?? lastClosed.expectedAmount ?? 0),
          date: new Date(lastClosed.closedAt).toLocaleString(locale, {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          }),
          name: lastClosed.closedByName ?? "—",
        })
      : t("neverClosed");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} isLoading={openSession.isPending}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("openDrawer.title")}</DrawerTitle>
          {register && <DrawerDescription>{register.name}</DrawerDescription>}
        </DrawerHeader>
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="cash-opening-amount" className="text-sm font-medium">
              {t("openDrawer.amountLabel")}
            </label>
            <CurrencyInput
              id="cash-opening-amount"
              size="lg"
              value={openingAmount}
              onChange={setOpeningAmount}
              placeholder="0"
            />
            <p className="text-xs text-slate-500">{lastCloseText}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="cash-open-notes" className="text-sm font-medium">
              {t("openDrawer.noteLabel")}
            </label>
            <Textarea
              id="cash-open-notes"
              value={notes}
              placeholder={t("openDrawer.notePlaceholder")}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
          {user?.name && (
            <p className="rounded-card bg-slate-50 p-4 text-sm text-slate-600">
              {t("openDrawer.responsible", { name: user.name })}
            </p>
          )}
        </div>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={submit} disabled={!register || openSession.isPending}>
            {t("openDrawer.confirm", { amount: formatCOP(openingAmount) })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
