"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 mb-5">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t("welcomeTitle")}
          </h1>
          <p className="text-slate-500">{t("welcomeSubtitle")}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {t("title")}
            </h2>
            <p className="text-slate-500 text-sm">{t("subtitle")}</p>
          </div>

          <LoginForm />
        </div>

        {/* Register link */}
        <p className="text-center text-slate-500 text-sm mt-8">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-indigo-500 hover:text-indigo-600 font-medium hover:underline"
          >
            {t("registerLink")}
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
