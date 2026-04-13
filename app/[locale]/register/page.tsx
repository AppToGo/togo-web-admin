"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CardContent } from "@/components/ui/card";
import { RegistrationWizard } from "@/features/auth/components/RegistrationWizard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Inner component that reads search params (requires Suspense boundary)
 */
function RegisterPageContent() {
  const t = useTranslations("auth.register");
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const parsedPlan = planParam ? parseInt(planParam, 10) : undefined;
  const validPlan =
    parsedPlan && parsedPlan >= 1 && parsedPlan <= 4 ? parsedPlan : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] p-4">
      <div className="w-full max-w-lg animate-slideIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#6366F1] shadow-lg shadow-[#6366F1]/25 mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("welcomeTitle")}
          </h1>
          <p className="text-slate-500 mt-1">{t("welcomeSubtitle")}</p>
        </div>

        {/* Registration Card */}
        <div className="border-0 shadow-xl shadow-slate-200/50 rounded-xl bg-white">
          <CardContent className="pt-6">
            <RegistrationWizard initialPlan={validPlan} />
          </CardContent>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-[#6366F1] hover:text-[#5558E0] hover:underline font-medium"
          >
            {t("loginLink")}
          </Link>
        </p>

        {/* Language Switcher */}
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

/**
 * Register page — wraps content in Suspense to satisfy Next.js requirement
 * for components that call useSearchParams() in the page tree.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]" />
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
