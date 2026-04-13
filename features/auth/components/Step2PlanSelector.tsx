"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useUpdateRegistrationPlan } from "@/features/auth/hooks/useAuth";
import { useRegistrationStore } from "@/features/auth/stores/registration.store";

const PLANS = [
  { id: 1, key: "free", recommended: false },
  { id: 2, key: "basic", recommended: true },
  { id: 3, key: "pro", recommended: false },
  { id: 4, key: "enterprise", recommended: false },
] as const;

export function Step2PlanSelector() {
  const t = useTranslations("auth.register.wizard");
  const { businessId, registrationToken, goToStep, resetWizard } = useRegistrationStore();
  const updatePlan = useUpdateRegistrationPlan();
  const [selectedPlan, setSelectedPlan] = useState<number>(2);

  const handleSubmit = () => {
    if (!businessId || !registrationToken) {
      toast.error(t("sessionExpired"));
      resetWizard();
      return;
    }
    updatePlan.mutate({ businessId, registrationToken, plan: selectedPlan });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={[
              "w-full text-left p-4 rounded-xl border-2 transition-all",
              selectedPlan === plan.id
                ? "border-[#6366F1] bg-[#6366F1]/5"
                : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    selectedPlan === plan.id
                      ? "border-[#6366F1] bg-[#6366F1]"
                      : "border-slate-300",
                  ].join(" ")}
                >
                  {selectedPlan === plan.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {t(`plans.${plan.key}.name`)}
                    </span>
                    {plan.recommended && (
                      <Badge className="bg-[#6366F1] text-white text-xs">
                        {t("plans.recommended")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {t(`plans.${plan.key}.description`)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <span className="font-bold text-slate-900">
                  {t(`plans.${plan.key}.price`)}
                </span>
                <span className="text-xs text-slate-400 block">
                  {t("plans.perMonth")}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        isLoading={updatePlan.isPending}
        disabled={updatePlan.isPending}
      >
        {t("continueToPay")}
      </Button>

      <button
        type="button"
        onClick={() => goToStep(1)}
        className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2"
      >
        {t("goBack")}
      </button>
    </div>
  );
}
