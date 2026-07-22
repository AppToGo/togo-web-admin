"use client";

import * as React from "react";
import { Zap, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useOpenUpgradePlanModal } from "../hooks/useUpgradePlanModal";

const URGENT_THRESHOLD_DAYS = 3;

/**
 * Banner global y persistente que recuerda al negocio en plan Free cuántos
 * días le quedan de prueba gratis, con CTA directo al modal de upgrade.
 *
 * A diferencia de FreePlanBanner (estático, solo en /dashboard), este banner
 * se monta una vez en DashboardLayout y es visible en TODAS las páginas
 * mientras el negocio esté en trial — cumple el requisito de "recordar todo
 * el tiempo cuántos días quedan".
 */
export function TrialBanner() {
  const t = useTranslations("dashboard.trialBanner");
  const user = useCurrentUser();
  const openUpgradeModal = useOpenUpgradePlanModal();

  // Solo aplica a negocios en plan Free con trialEndsAt conocido
  if (user?.subscriptionPlan !== 1 || !user?.trialEndsAt) return null;

  const daysRemaining = Math.ceil(
    (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isExpired = daysRemaining < 0;
  const isUrgent = isExpired || daysRemaining <= URGENT_THRESHOLD_DAYS;

  const message = isExpired
    ? t("expired")
    : daysRemaining === 0
      ? t("lastDay")
      : daysRemaining === 1
        ? t("oneDayRemaining")
        : t("daysRemaining", { days: daysRemaining });

  return (
    <div
      className={cn(
        "w-full px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap",
        isUrgent
          ? "bg-amber-50 border-b border-amber-200"
          : "bg-indigo-50 border-b border-indigo-200"
      )}
    >
      <div className="flex items-center gap-2 text-center sm:text-left">
        {isUrgent ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
        )}
        <p className={cn("text-sm font-medium", isUrgent ? "text-amber-900" : "text-indigo-900")}>
          {message}
          <span
            className={cn(
              "font-normal ml-1.5",
              isUrgent ? "text-amber-700" : "text-indigo-600"
            )}
          >
            {t("subtitle")}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={openUpgradeModal}
        className={cn(
          "flex-shrink-0 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors",
          isUrgent ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
        )}
      >
        {t("cta")}
      </button>
    </div>
  );
}
