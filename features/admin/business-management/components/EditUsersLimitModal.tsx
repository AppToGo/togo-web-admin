"use client";

/**
 * Edit Users Limit Modal Component
 * Modal for editing the active-users limit override for a business
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
import { PLAN_OPTIONS, UNLIMITED_PLAN_LIMIT } from "../constants/payment-status";
import type { BusinessWithSubscription } from "../types/business-subscription.types";
import { usePlanCatalog } from "@/features/subscription/hooks/usePlanCatalog";

interface EditUsersLimitModalProps {
  business: BusinessWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { maxUsersOverride: number | null }) => void;
  isSubmitting?: boolean;
}

export function EditUsersLimitModal({
  business,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EditUsersLimitModalProps) {
  const t = useTranslations("admin-businesses");
  // El estado inicial sale del negocio: la página monta el modal con
  // key={business.id}, así cada negocio arranca con sus propios valores.
  const currentOverride = business?.subscription?.maxUsersOverride;
  const hasOverride = currentOverride !== null && currentOverride !== undefined;
  const [useOverride, setUseOverride] = useState(hasOverride);
  const [overrideValue, setOverrideValue] = useState(
    hasOverride ? String(currentOverride) : ""
  );

  const { data: catalog } = usePlanCatalog();
  const currentPlan = business?.subscription?.plan || 1;
  const planMaxUsers = catalog?.plans.find((p) => p.plan === currentPlan)?.maxUsers;
  const isPlanUnlimited =
    planMaxUsers !== undefined && planMaxUsers >= UNLIMITED_PLAN_LIMIT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      maxUsersOverride: useOverride ? parseInt(overrideValue, 10) : null,
    });
  };

  const handleClose = () => {
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
            <DialogTitle>{t("modals.editUsers.title")}</DialogTitle>
            <DialogDescription>
              {t("modals.editUsers.description", {
                businessName: business?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 p-7">
            {/* Current Plan Info */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">
                  {t("modals.editUsers.currentPlan")}
                </span>
                <span className="font-medium">{planLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  {t("modals.editUsers.planLimit")}
                </span>
                <span className="font-medium">
                  {planMaxUsers === undefined
                    ? "-"
                    : isPlanUnlimited
                      ? "∞"
                      : t("modals.editUsers.usersCount", { count: planMaxUsers })}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">
                  {t("modals.editUsers.currentUsers")}
                </span>
                <span className="font-medium">
                  {t("modals.editUsers.usersCount", {
                    count: business?.userCount || 0,
                  })}
                </span>
              </div>
            </div>

            {/* Override Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-users-override">
                  {t("modals.editUsers.useOverride")}
                </Label>
                <p className="text-sm text-slate-500">
                  {t("modals.editUsers.overrideDescription")}
                </p>
              </div>
              <Switch
                id="use-users-override"
                checked={useOverride}
                onCheckedChange={setUseOverride}
              />
            </div>

            {/* Override Value Input */}
            {useOverride && (
              <div className="grid gap-2">
                <Label htmlFor="users-override-value">
                  {t("modals.editUsers.overrideValue")} *
                </Label>
                <Input
                  id="users-override-value"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="Ej: 10"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  required={useOverride}
                />
                <p className="text-xs text-slate-500">
                  {t("modals.editUsers.overrideHint")}
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
              {t("modals.editUsers.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
