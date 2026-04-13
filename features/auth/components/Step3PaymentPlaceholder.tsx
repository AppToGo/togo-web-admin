"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, CreditCard } from "lucide-react";
import { useRegistrationStore } from "@/features/auth/stores/registration.store";

function resolvePlanKey(plan: number | null): string {
  if (plan === 1) return "free";
  if (plan === 3) return "pro";
  if (plan === 4) return "enterprise";
  return "basic";
}

export function Step3PaymentPlaceholder() {
  const t = useTranslations("auth.register.wizard");
  const router = useRouter();
  const { selectedPlan, businessId, resetWizard, goToStep } = useRegistrationStore();

  const planKey = resolvePlanKey(selectedPlan);

  // Guard: redirect to step 1 if critical data is missing
  React.useEffect(() => {
    if (!businessId || !selectedPlan) {
      resetWizard();
      goToStep(1);
    }
  }, [businessId, selectedPlan, resetWizard, goToStep]);

  if (!businessId || !selectedPlan) {
    return null;
  }

  const handleGoToLogin = () => {
    resetWizard();
    router.push("/login?registered=true");
  };

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg">
          {t("payment.title")}
        </h3>
        <p className="text-slate-500 text-sm mt-1">{t("payment.subtitle")}</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t("payment.selectedPlan")}</p>
          <p className="font-semibold text-slate-900">
            {t(`plans.${planKey}.name`)}
          </p>
        </div>
        <div className="text-right">
          <Badge
            variant="outline"
            className="border-[#6366F1] text-[#6366F1]"
          >
            {t(`plans.${planKey}.price`)}/{t("plans.perMonth")}
          </Badge>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>{t("payment.alertTitle")}</strong> {t("payment.alertBody")}
        </AlertDescription>
      </Alert>

      <div className="border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            {t("payment.instructions")}
          </span>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p>
            <span className="font-medium">{t("payment.referenceLabel")}: </span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
              {businessId ?? "—"}
            </code>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {t("payment.referenceHint")}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {t("payment.nextStepsTitle")}
        </p>
        {([1, 2, 3] as const).map((step) => (
          <div key={step} className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] text-slate-500 font-bold">
                {step}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {t(`payment.nextStep${step}`)}
            </p>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={handleGoToLogin}>
        {t("payment.goToLogin")}
      </Button>
    </div>
  );
}
