"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

interface RegistrationProgressStepsProps {
  currentStep: 1 | 2 | 3;
  skipPlanStep?: boolean;
}

export function RegistrationProgressSteps({
  currentStep,
  skipPlanStep = false,
}: RegistrationProgressStepsProps) {
  const t = useTranslations("auth.register.wizard");

  const steps = skipPlanStep
    ? [
        { key: "step1", label: t("step1Label") },
        { key: "step3", label: t("step3Label") },
      ]
    : [
        { key: "step1", label: t("step1Label") },
        { key: "step2", label: t("step2Label") },
        { key: "step3", label: t("step3Label") },
      ];

  // When skipping plan step, map currentStep=3 to display position 2
  const displayStep = skipPlanStep && currentStep === 3 ? 2 : currentStep;

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = displayStep > stepNumber;
        const isActive = displayStep === stepNumber;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted ? "bg-[#6366F1] text-white" : "",
                  isActive
                    ? "bg-[#6366F1] text-white ring-4 ring-[#6366F1]/20"
                    : "",
                  !isCompleted && !isActive
                    ? "bg-slate-100 text-slate-400"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={[
                  "text-xs mt-1 font-medium",
                  isActive
                    ? "text-[#6366F1]"
                    : isCompleted
                      ? "text-slate-600"
                      : "text-slate-400",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={[
                  "h-[2px] w-12 mx-1 mb-4 transition-all",
                  displayStep > stepNumber ? "bg-[#6366F1]" : "bg-slate-200",
                ].join(" ")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
