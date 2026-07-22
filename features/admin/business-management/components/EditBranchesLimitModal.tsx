"use client";

/**
 * Edit Branches Limit Modal Component
 * Modal for editing the branches limit override for a business
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
import { Switch } from "@/components/ui/switch";
import { getPlanMaxBranches, PLAN_OPTIONS, UNLIMITED_PLAN_LIMIT } from "../constants/payment-status";
import type { BusinessWithSubscription } from "../types/business-subscription.types";

interface EditBranchesLimitModalProps {
  business: BusinessWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { maxBranchesOverride: number | null }) => void;
  isSubmitting?: boolean;
}

export function EditBranchesLimitModal({
  business,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EditBranchesLimitModalProps) {
  const t = useTranslations("admin-businesses");
  const [useOverride, setUseOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState("");

  const currentPlan = business?.subscription?.plan || 1;
  const planMaxBranches = getPlanMaxBranches(currentPlan);
  const isPlanUnlimited = planMaxBranches >= UNLIMITED_PLAN_LIMIT;
  const currentOverride = business?.subscription?.maxBranchesOverride;

  useEffect(() => {
    if (business) {
      const hasOverride =
        currentOverride !== null && currentOverride !== undefined;
      setUseOverride(hasOverride);
      setOverrideValue(hasOverride ? String(currentOverride) : "");
    }
  }, [business, currentOverride]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      maxBranchesOverride: useOverride ? parseInt(overrideValue, 10) : null,
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
            <DialogTitle>{t("modals.editBranches.title")}</DialogTitle>
            <DialogDescription>
              {t("modals.editBranches.description", {
                businessName: business?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 p-7">
            {/* Current Plan Info */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">
                  {t("modals.editBranches.currentPlan")}
                </span>
                <span className="font-medium">{planLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  {t("modals.editBranches.planLimit")}
                </span>
                <span className="font-medium">
                  {isPlanUnlimited ? "∞" : `${planMaxBranches} sedes`}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">
                  {t("modals.editBranches.currentBranches")}
                </span>
                <span className="font-medium">
                  {business?.branchesCount || 0} sedes
                </span>
              </div>
            </div>

            {/* Override Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-override">
                  {t("modals.editBranches.useOverride")}
                </Label>
                <p className="text-sm text-slate-500">
                  {t("modals.editBranches.overrideDescription")}
                </p>
              </div>
              <Switch
                id="use-override"
                checked={useOverride}
                onCheckedChange={setUseOverride}
              />
            </div>

            {/* Override Value Input */}
            {useOverride && (
              <div className="grid gap-2">
                <Label htmlFor="override-value">
                  {t("modals.editBranches.overrideValue")} *
                </Label>
                <Input
                  id="override-value"
                  type="number"
                  min="1"
                  placeholder="Ej: 15"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  required={useOverride}
                />
                <p className="text-xs text-slate-500">
                  {t("modals.editBranches.overrideHint")}
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
              {t("modals.editBranches.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
