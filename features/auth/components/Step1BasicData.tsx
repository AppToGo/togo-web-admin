"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Step1Data {
  name: string;
  email: string;
  localPhone: string;
  password: string;
}

interface Step1BasicDataProps {
  onContinue: (data: Step1Data) => void;
}

export function Step1BasicData({ onContinue }: Step1BasicDataProps) {
  const t = useTranslations("auth.register");

  const PHONE_PREFIX = "+57";

  const [formData, setFormData] = useState<Step1Data>({
    name: "",
    email: "",
    localPhone: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChange =
    (field: keyof Step1Data) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (field === "localPhone") {
        value = value.replace(/\D/g, "");
      }
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

      <Input
        label={t("phone.label")}
        type="tel"
        prefix={PHONE_PREFIX}
        placeholder="3001234567"
        value={formData.localPhone}
        onChange={handleChange("localPhone")}
        required
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
