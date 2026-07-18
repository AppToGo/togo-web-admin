"use client";

import * as React from "react";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/features/auth/hooks/useAuth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(email, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          {t("success.title")}
        </h3>
        <p className="text-sm text-slate-500">
          {t("success.message", { email })}
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full mt-4">
            {t("backToLogin")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-500">
        {t("instructions")}
      </p>

      <Input
        label={t("email.label")}
        type="email"
        placeholder={t("email.placeholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={forgotPassword.isPending}
        disabled={forgotPassword.isPending}
      >
        {forgotPassword.isPending ? t("sending") : t("submit")}
      </Button>

      <p className="text-center text-sm text-slate-500">
        {t("remembered")}{" "}
        <Link
          href="/login"
          className="text-[#6366F1] hover:text-[#5558E0] hover:underline font-medium"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
