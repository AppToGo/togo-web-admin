"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CardContent } from "@/components/ui/card";
import { RegistrationWizard } from "@/features/auth/components/RegistrationWizard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Register page — PLG flow (user-data → business-data → success)
 */
export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] p-4">
      <div className="w-full max-w-lg animate-slideIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Togo"
            width={56}
            height={56}
            className="mx-auto rounded-full shadow-lg shadow-[#6366F1]/25 mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-slate-900">
            {t("welcomeTitle")}
          </h1>
          <p className="text-slate-500 mt-1">{t("welcomeSubtitle")}</p>
        </div>

        {/* Registration Card */}
        <div className="border-0 shadow-xl shadow-slate-200/50 rounded-xl bg-white">
          <CardContent className="pt-6">
            <RegistrationWizard />
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
