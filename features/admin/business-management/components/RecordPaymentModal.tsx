"use client";

/**
 * Record Payment Modal Component
 * Modal for recording a new payment for a business
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHODS, PLAN_OPTIONS, getPlanLabel } from "../constants/payment-status";
import { usePlanCatalog } from "@/features/subscription/hooks/usePlanCatalog";
import type { BusinessWithSubscription, RecordPaymentDto } from "../types/business-subscription.types";

interface RecordPaymentModalProps {
  business: BusinessWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordPaymentDto) => void;
  isSubmitting?: boolean;
}

// Sentinel para el <Select> — Radix no permite value="" en SelectItem
const NO_PLAN_VALUE = "none";

export function RecordPaymentModal({
  business,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: RecordPaymentModalProps) {
  const t = useTranslations("admin-businesses");
  const { data: catalog } = usePlanCatalog(isOpen);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [activatePlan, setActivatePlan] = useState<string>(NO_PLAN_VALUE);

  const requestedPlan = business?.subscription?.requestedPlan ?? null;

  const getPlanPrice = (plan: number): number | null =>
    catalog?.plans.find((p) => p.plan === plan)?.priceMonthly ?? null;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: catalog?.currency ?? "COP",
      maximumFractionDigits: 0,
    }).format(amount);

  // Reset form when modal opens — si el negocio tiene una solicitud
  // pendiente, se preselecciona (activar es el flujo esperado: verificar el
  // pago ES activar el plan) y se prellena el monto con el precio del plan.
  useEffect(() => {
    if (isOpen) {
      setMethod("");
      setReference("");
      setNotes("");
      setPaidAt(new Date().toISOString().split("T")[0]);

      if (requestedPlan != null) {
        setActivatePlan(String(requestedPlan));
        const price = getPlanPrice(requestedPlan);
        setAmount(price != null ? String(price) : "");
      } else {
        setActivatePlan(NO_PLAN_VALUE);
        setAmount("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestedPlan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: parseFloat(amount),
      method,
      reference: reference || undefined,
      notes: notes || undefined,
      paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
      activatePlan: activatePlan === NO_PLAN_VALUE ? undefined : Number(activatePlan),
    });
  };

  const handleClose = () => {
    // Reset form
    setAmount("");
    setMethod("");
    setReference("");
    setNotes("");
    setPaidAt(new Date().toISOString().split("T")[0]);
    setActivatePlan(NO_PLAN_VALUE);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("modals.recordPayment.title")}</DialogTitle>
            <DialogDescription>
              {t("modals.recordPayment.description", {
                businessName: business?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-7">
            {requestedPlan != null && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    {t("modals.recordPayment.activatePlan.title")}
                  </p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    {t("modals.recordPayment.activatePlan.description", {
                      businessName: business?.name ?? "",
                      planName: getPlanLabel(requestedPlan),
                      price: (() => {
                        const price = getPlanPrice(requestedPlan);
                        return price != null ? formatPrice(price) : "-";
                      })(),
                    })}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Select value={activatePlan} onValueChange={setActivatePlan}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(requestedPlan)}>
                        {t("modals.recordPayment.activatePlan.activate", {
                          planName: getPlanLabel(requestedPlan),
                        })}
                      </SelectItem>
                      <SelectItem value={NO_PLAN_VALUE}>
                        {t("modals.recordPayment.activatePlan.keepCurrent")}
                      </SelectItem>
                      {PLAN_OPTIONS.filter((p) => p.value !== requestedPlan).map((p) => (
                        <SelectItem key={p.value} value={String(p.value)}>
                          {t("modals.recordPayment.activatePlan.choosePlan")}: {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                {t("modals.recordPayment.amount")} *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="grid gap-2">
              <Label htmlFor="method">
                {t("modals.recordPayment.method")} *
              </Label>
              <Select value={method} onValueChange={setMethod} required>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("modals.recordPayment.selectMethod")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="grid gap-2">
              <Label htmlFor="reference">
                {t("modals.recordPayment.reference")}
              </Label>
              <Input
                id="reference"
                placeholder={t("modals.recordPayment.referencePlaceholder")}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Payment Date */}
            <div className="grid gap-2">
              <Label htmlFor="paidAt">{t("modals.recordPayment.paidAt")}</Label>
              <Input
                id="paidAt"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("modals.recordPayment.notes")}</Label>
              <Textarea
                id="notes"
                placeholder={t("modals.recordPayment.notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("modals.cancel")}
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {t("modals.recordPayment.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
