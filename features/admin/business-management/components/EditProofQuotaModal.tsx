"use client";

/**
 * Edit Proof Quota Modal Component
 * Modal for editing the monthly receipt-analysis quota override for a business
 */

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { getPlanMaxProofs, PLAN_OPTIONS, UNLIMITED_PLAN_LIMIT } from "../constants/payment-status";
import type { BusinessWithSubscription } from "../types/business-subscription.types";
import { usePlanCatalog } from "@/features/subscription/hooks/usePlanCatalog";

interface EditProofQuotaModalProps {
  business: BusinessWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { proofQuotaOverride: number | null }) => void;
  isSubmitting?: boolean;
}

function formatQuota(value: number, unlimitedLabel: string): string {
  if (value >= UNLIMITED_PLAN_LIMIT) return unlimitedLabel;
  return `${value}`;
}

export function EditProofQuotaModal({
  business,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EditProofQuotaModalProps) {
  const t = useTranslations("admin-businesses");
  const [useOverride, setUseOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState("");
  const [syncedBusinessId, setSyncedBusinessId] = useState<string | null>(null);

  const { data: catalog } = usePlanCatalog();
  const currentPlan = business?.subscription?.plan || 1;
  const planMaxProofs = getPlanMaxProofs(currentPlan, catalog?.plans);
  const isPlanUnlimited = planMaxProofs >= UNLIMITED_PLAN_LIMIT;
  const currentOverride = business?.subscription?.proofQuotaOverride;

  // Sincronizar el formulario al cambiar de negocio (ajuste durante el
  // render, no en un efecto, para no disparar renders en cascada).
  if (business && business.id !== syncedBusinessId) {
    setSyncedBusinessId(business.id);
    const hasOverride =
      currentOverride !== null && currentOverride !== undefined;
    setUseOverride(hasOverride);
    setOverrideValue(hasOverride ? String(currentOverride) : "");
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      proofQuotaOverride: useOverride ? parseInt(overrideValue, 10) : null,
    });
  };

  const handleClose = () => {
    setUseOverride(false);
    setOverrideValue("");
    onClose();
  };

  const planLabel =
    PLAN_OPTIONS.find((p) => p.value === currentPlan)?.label ||
    `Plan ${currentPlan}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("modals.editProofQuota.title")}</DialogTitle>
            <DialogDescription>
              {t("modals.editProofQuota.description", {
                businessName: business?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 p-7">
            {/* Current Plan Info */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">
                  {t("modals.editProofQuota.currentPlan")}
                </span>
                <span className="font-medium">{planLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  {t("modals.editProofQuota.planQuota")}
                </span>
                <span className="font-medium">
                  {isPlanUnlimited
                    ? t("modals.editProofQuota.unlimited")
                    : t("modals.editProofQuota.perMonth", {
                        count: formatQuota(planMaxProofs, ""),
                      })}
                </span>
              </div>
            </div>

            {/* Override Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-quota-override">
                  {t("modals.editProofQuota.useOverride")}
                </Label>
                <p className="text-sm text-slate-500">
                  {t("modals.editProofQuota.overrideDescription")}
                </p>
              </div>
              <Switch
                id="use-quota-override"
                checked={useOverride}
                onCheckedChange={setUseOverride}
              />
            </div>

            {/* Override Value Input */}
            {useOverride && (
              <div className="grid gap-2">
                <Label htmlFor="quota-override-value">
                  {t("modals.editProofQuota.overrideValue")} *
                </Label>
                <Input
                  id="quota-override-value"
                  type="number"
                  min="0"
                  placeholder="Ej: 500"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  required={useOverride}
                />
                <p className="text-xs text-slate-500">
                  {t("modals.editProofQuota.overrideHint")}
                </p>
              </div>
            )}
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
              {t("modals.editProofQuota.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
