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
import { PAYMENT_METHODS } from "../constants/payment-status";
import type { BusinessWithSubscription } from "../types/business-subscription.types";

interface RecordPaymentModalProps {
  business: BusinessWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
  }) => void;
  isSubmitting?: boolean;
}

export function RecordPaymentModal({
  business,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: RecordPaymentModalProps) {
  const t = useTranslations("admin-businesses");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setMethod("");
      setReference("");
      setNotes("");
      setPaidAt(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: parseFloat(amount),
      method,
      reference: reference || undefined,
      notes: notes || undefined,
      paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
    });
  };

  const handleClose = () => {
    // Reset form
    setAmount("");
    setMethod("");
    setReference("");
    setNotes("");
    setPaidAt(new Date().toISOString().split("T")[0]);
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
