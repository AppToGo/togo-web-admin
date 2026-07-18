"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRegistrationStore } from "@/features/auth/stores/registration.store";

export function Step3PaymentPlaceholder() {
  const t = useTranslations("auth.register.wizard");
  const router = useRouter();
  const { resetWizard } = useRegistrationStore();

  const handleGoToLogin = () => {
    resetWizard();
    router.push("/login?registered=true");
  };

  return (
    <div className="space-y-6 text-center">
      <div className="py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-xl">
          {t("success.title")}
        </h3>
        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
          {t("success.subtitle")}
        </p>
      </div>

      <div className="bg-indigo-50 rounded-xl p-4 text-left">
        <p className="text-sm font-medium text-indigo-900 mb-1">
          {t("success.freePlanTitle")}
        </p>
        <p className="text-xs text-indigo-700">
          {t("success.freePlanBody")}
        </p>
      </div>

      <Button className="w-full" onClick={handleGoToLogin}>
        {t("success.goToLogin")}
      </Button>
    </div>
  );
}
