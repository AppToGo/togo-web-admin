"use client";

import * as React from "react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRegistrationStore } from "@/features/auth/stores/registration.store";
import { RegistrationProgressSteps } from "./RegistrationProgressSteps";
import { Step1BasicData } from "./Step1BasicData";
import { Step2PlanSelector } from "./Step2PlanSelector";
import { Step3PaymentPlaceholder } from "./Step3PaymentPlaceholder";

interface RegistrationWizardProps {
  initialPlan?: number;
}

export function RegistrationWizard({ initialPlan }: RegistrationWizardProps) {
  const t = useTranslations("auth.register.wizard");
  const { currentStep, isExpired, resetWizard } = useRegistrationStore();

  // On mount: check expiration only if wizard is past step 1
  useEffect(() => {
    const { currentStep } = useRegistrationStore.getState();
    if (isExpired() && currentStep > 1) {
      resetWizard();
      toast.warning(t("sessionExpiredWarning"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: reset if state is incoherent (past step 1 but missing critical data)
  useEffect(() => {
    const state = useRegistrationStore.getState();
    const isIncoherent =
      (state.currentStep > 1 && !state.businessId) ||
      (state.currentStep > 1 && !state.registrationToken);

    if (isIncoherent) {
      resetWizard();
    }
  }, [resetWizard]);

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: t("step1Title"),
    2: t("step2Title"),
    3: t("step3Title"),
  };

  const stepDescriptions: Record<1 | 2 | 3, string> = {
    1: t("step1Description"),
    2: t("step2Description"),
    3: t("step3Description"),
  };

  return (
    <div className="space-y-2">
      <RegistrationProgressSteps
        currentStep={currentStep}
        skipPlanStep={!!initialPlan}
      />

      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          {stepTitles[currentStep]}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {stepDescriptions[currentStep]}
        </p>
      </div>

      {currentStep === 1 && <Step1BasicData initialPlan={initialPlan} />}
      {currentStep === 2 && <Step2PlanSelector />}
      {currentStep === 3 && <Step3PaymentPlaceholder />}
    </div>
  );
}
