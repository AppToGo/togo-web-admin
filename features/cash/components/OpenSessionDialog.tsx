"use client";
/**
 * Apertura de turno: base inicial (>= 0) + referencia del último cierre
 * de la caja (plan: "referencia último cierre").
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "./CurrencyInput";
import { useOpenSession } from "../hooks/useCashMutations";
import { formatCOP } from "../utils/cash.utils";
import type { CashRegister, CashSession } from "../types/cash.types";

interface OpenSessionDialogProps {
  businessId: string;
  branchId: string;
  register: CashRegister | null;
  lastClosed: (CashSession & { register?: { id: string; name: string } }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpened?: (sessionId: string) => void;
}

export function OpenSessionDialog({
  businessId,
  branchId,
  register,
  lastClosed,
  open,
  onOpenChange,
  onOpened,
}: OpenSessionDialogProps) {
  const t = useTranslations("cash");
  const [openingAmount, setOpeningAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const openSession = useOpenSession(businessId, branchId);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("openSession")}
            {register ? ` — ${register.name}` : ""}
          </DialogTitle>
          <DialogDescription>
            {lastClosed?.closedAt
              ? `${t("lastClose")}: ${formatCOP(lastClosed.countedAmount ?? lastClosed.expectedAmount ?? 0)}`
              : t("neverClosed")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cash-opening-amount" className="text-sm font-medium">
              {t("openingAmount")}
            </label>
            <CurrencyInput
              id="cash-opening-amount"
              value={openingAmount}
              onChange={setOpeningAmount}
              min={0}
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
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={!register || openSession.isPending}
          >
            {t("openSession")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
