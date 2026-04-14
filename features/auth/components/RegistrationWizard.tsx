"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRegistrationStore } from "@/features/auth/stores/registration.store";
import { RegistrationProgressSteps } from "./RegistrationProgressSteps";
import { Step1BasicData, type Step1Data } from "./Step1BasicData";
import { Step2BusinessData } from "./Step2BusinessData";
import { Step3PaymentPlaceholder } from "./Step3PaymentPlaceholder";

export function RegistrationWizard() {
  const t = useTranslations("auth.register.wizard");
  const { currentStep, isExpired, resetWizard } = useRegistrationStore();

  // Step1 data is kept in local React state — NOT persisted (avoids storing passwords)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  // Reset if session expired (only if past step 1)
  useEffect(() => {
    if (isExpired() && currentStep > 1) {
      resetWizard();
      toast.warning(t("sessionExpiredWarning"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset if state is incoherent after a page refresh
  useEffect(() => {
    const state = useRegistrationStore.getState();
    // On step 2 after refresh: step1Data is null (lost from memory) → reset to 1
    if (state.currentStep === 2 && !step1Data) {
      resetWizard();
    }
    // On step 3 without businessId → reset to 1
    if (state.currentStep === 3 && !state.businessId) {
      resetWizard();
    }
  }, [step1Data, resetWizard]);

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

  const handleStep1Continue = (data: Step1Data) => {
    setStep1Data(data);
    useRegistrationStore.getState().goToStep(2);
  };

  const handleGoBack = () => {
    setStep1Data(null);
    useRegistrationStore.getState().goToStep(1);
  };

  return (
    <div className="space-y-2">
      <RegistrationProgressSteps currentStep={currentStep} />

      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          {stepTitles[currentStep]}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {stepDescriptions[currentStep]}
        </p>
      </div>

      {currentStep === 1 && (
        <Step1BasicData onContinue={handleStep1Continue} />
      )}
      {currentStep === 2 && step1Data && (
        <Step2BusinessData step1Data={step1Data} onBack={handleGoBack} />
      )}
      {currentStep === 3 && <Step3PaymentPlaceholder />}
    </div>
  );
}
