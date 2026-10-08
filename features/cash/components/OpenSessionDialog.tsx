"use client";
/**
 * Apertura de turno: base inicial (>= 0) + referencia del último cierre
 * de ESTA caja (plan: "referencia último cierre"). El cierre se pide acá,
 * filtrado por caja y solo al abrir el panel: con el historial de la sede
 * la referencia podía ser el cierre de otra caja.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { CurrencyInput } from "./CurrencyInput";
import { useOpenSession } from "../hooks/useCashMutations";
import { useSessionsHistory } from "../hooks/useCash";
import { formatCOP } from "../utils/cash.utils";
import type { CashRegister } from "../types/cash.types";

interface OpenSessionDialogProps {
  businessId: string;
  branchId: string;
  register: CashRegister | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpened?: (sessionId: string) => void;
}

export function OpenSessionDialog({
  businessId,
  branchId,
  register,
  open,
  onOpenChange,
  onOpened,
}: OpenSessionDialogProps) {
  const t = useTranslations("cash");
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {t("openSession")}
            {register ? ` — ${register.name}` : ""}
          </DrawerTitle>
          <DrawerDescription>
            {isLoadingLastClosed
              ? "…"
              : lastClosed?.closedAt
                ? `${t("lastClose")}: ${formatCOP(lastClosed.countedAmount ?? lastClosed.expectedAmount ?? 0)}`
                : t("neverClosed")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="cash-opening-amount" className="text-sm font-medium">
              {t("openingAmount")}
            </label>
            <CurrencyInput
              id="cash-opening-amount"
              value={openingAmount}
              onChange={setOpeningAmount}
            />
            <p className="text-xs text-slate-500">{t("openingAmountHint")}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="cash-open-notes" className="text-sm font-medium">
              {t("sessions.notes")}
            </label>
            <Textarea
              id="cash-open-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={submit}
            disabled={!register || openSession.isPending}
          >
            {t("openSession")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
