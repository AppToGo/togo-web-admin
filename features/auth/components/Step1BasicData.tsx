"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";

export interface Step1Data {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  // @deprecated localPhone kept for backward compat, use phoneNumber
  localPhone?: string;
}

interface Step1BasicDataProps {
  onContinue: (data: Step1Data) => void;
}

export function Step1BasicData({ onContinue }: Step1BasicDataProps) {
  const t = useTranslations("auth.register");

  const [formData, setFormData] = useState<Step1Data>({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChange =
    (field: keyof Omit<Step1Data, "phoneNumber">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const passwordMismatch =
    confirmPassword.length > 0 && formData.password !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch) return;
    onContinue(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t("name.label")}
        placeholder={t("name.placeholder")}
        value={formData.name}
        onChange={handleChange("name")}
        required
      />

      <Input
        label={t("email.label")}
        type="email"
        placeholder={t("email.placeholder")}
        value={formData.email}
        onChange={handleChange("email")}
        required
      />

      <PhoneInput
        label={t("phone.label")}
        value={formData.phoneNumber}
        onChange={(v) => setFormData((prev) => ({ ...prev, phoneNumber: v }))}
        required
        helperText={t("phone.helper")}
      />

      <Input
        label={t("password.label")}
        type="password"
        placeholder={t("password.placeholder")}
        value={formData.password}
        onChange={handleChange("password")}
        required
        helperText={t("password.helper")}
      />

      <Input
        label={t("confirmPassword.label")}
        type="password"
        placeholder={t("confirmPassword.placeholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        error={passwordMismatch ? t("wizard.passwordMismatch") : undefined}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={passwordMismatch}
      >
        {t("wizard.continueStep1")}
      </Button>
    </form>
  );
}
