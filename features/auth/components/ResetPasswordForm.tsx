"use client";

import * as React from "react";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/features/auth/hooks/useAuth";

interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const resetPassword = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Token missing or clearly invalid — show error state immediately
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-slate-600">{t("invalidToken")}</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full mt-2">
            {t("requestNewLink")}
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (newPassword.length < 8) {
      setValidationError(t("passwordMinLength", { min: 8 }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError(t("passwordMismatch"));
      return;
    }

    resetPassword.mutate({ token, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-500">{t("instructions")}</p>

      <Input
        label={t("newPassword.label")}
        type="password"
        placeholder={t("newPassword.placeholder")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
      />

      <Input
        label={t("confirmPassword.label")}
        type="password"
        placeholder={t("confirmPassword.placeholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {validationError && (
        <p className="text-sm text-red-500">{validationError}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        isLoading={resetPassword.isPending}
        disabled={resetPassword.isPending}
      >
        {resetPassword.isPending ? t("saving") : t("submit")}
      </Button>
    </form>
  );
}
