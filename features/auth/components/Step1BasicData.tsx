"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/features/auth/hooks/useAuth";

interface Step1BasicDataProps {
  initialPlan?: number;
}

export function Step1BasicData({ initialPlan }: Step1BasicDataProps) {
  const t = useTranslations("auth.register");
  const register = useRegister();

  const PHONE_PREFIX = "+57";

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    localPhone: "",
    password: "",
    confirmPassword: "",
  });

  const [emailError, setEmailError] = useState<string | null>(null);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (field === "localPhone") {
        // Strip any leading zeros or non-digits
        value = value.replace(/\D/g, "");
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "email") setEmailError(null);
    };

  const passwordMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch) return;

    register.mutate({
      name: formData.name,
      businessName: formData.businessName,
      email: formData.email,
      phoneNumber: `${PHONE_PREFIX}${formData.localPhone}`,
      password: formData.password,
      plan: initialPlan,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t("name.label")}
        placeholder={t("name.placeholder")}
        value={formData.name}
        onChange={handleChange("name")}
        required
        disabled={register.isPending}
      />

      <Input
        label={t("businessName.label")}
        placeholder={t("businessName.placeholder")}
        value={formData.businessName}
        onChange={handleChange("businessName")}
        required
        disabled={register.isPending}
      />

      <Input
        label={t("email.label")}
        type="email"
        placeholder={t("email.placeholder")}
        value={formData.email}
        onChange={handleChange("email")}
        required
        disabled={register.isPending}
        error={emailError ?? undefined}
      />

      <Input
        label={t("phone.label")}
        type="tel"
        prefix={PHONE_PREFIX}
        placeholder="3001234567"
        value={formData.localPhone}
        onChange={handleChange("localPhone")}
        required
        disabled={register.isPending}
        helperText={t("phone.helper")}
        maxLength={10}
        inputMode="numeric"
      />

      <Input
        label={t("password.label")}
        type="password"
        placeholder={t("password.placeholder")}
        value={formData.password}
        onChange={handleChange("password")}
        required
        disabled={register.isPending}
        helperText={t("password.helper")}
      />

      <Input
        label={t("confirmPassword.label")}
        type="password"
        placeholder={t("confirmPassword.placeholder")}
        value={formData.confirmPassword}
        onChange={handleChange("confirmPassword")}
        required
        disabled={register.isPending}
        error={passwordMismatch ? t("wizard.passwordMismatch") : undefined}
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={register.isPending}
        disabled={register.isPending || passwordMismatch}
      >
        {register.isPending ? t("creatingAccount") : t("wizard.continueStep1")}
      </Button>
    </form>
  );
}
