"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DemoLoginForm } from "@/features/auth/components/DemoLoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Página dedicada de acceso al modo demo.
 * Permite compartir un enlace directo (/:locale/demo) donde el visitante
 * ve de inmediato el formulario para ingresar sus datos y probar el panel.
 */
export default function DemoLoginPage() {
  const t = useTranslations("auth.login");
  const tRegister = useTranslations("auth.register");

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo y encabezado */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Togo"
            width={64}
            height={64}
            className="mx-auto rounded-full shadow-lg shadow-indigo-500/30 mb-5"
            priority
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t("demo.title")}
          </h1>
          <p className="text-slate-500 text-sm">{t("demo.subtitle")}</p>
        </div>

        {/* Tarjeta del formulario demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <DemoLoginForm />
        </div>

        {/* Enlaces a registro e inicio de sesión */}
        <div className="text-center text-slate-500 text-sm mt-8 space-y-2">
          <p>
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="text-indigo-500 hover:text-indigo-600 font-medium hover:underline"
            >
              {t("registerLink")}
            </Link>
          </p>
          <p>
            {tRegister("hasAccount")}{" "}
            <Link
              href="/login"
              className="text-indigo-500 hover:text-indigo-600 font-medium hover:underline"
            >
              {tRegister("loginLink")}
            </Link>
          </p>
        </div>

        {/* Selector de idioma */}
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
