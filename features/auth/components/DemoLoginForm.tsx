"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoLogin } from "@/features/auth/hooks/useAuth";
import { DEMO_WHATSAPP_NUMBER } from "@/features/auth/demo.constants";

const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

/**
 * Formulario de entrada al modo demo.
 *
 * Pide nombre + WhatsApp (el visitante solo podrá responder las
 * conversaciones que lleguen desde ese número), datos opcionales de su
 * negocio, consentimiento de contacto comercial, y le indica a qué número
 * escribir para vivir el inbox.
 */
export function DemoLoginForm() {
  const t = useTranslations("auth.login.demo");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [consent, setConsent] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const demoLogin = useDemoLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const cleanedPhone = phone.replace(/[\s()-]/g, "").trim();

    if (!PHONE_REGEX.test(cleanedPhone)) {
      setPhoneError(t("phone.invalid"));
      return;
    }

    setPhoneError(undefined);
    demoLogin.mutate({
      name: trimmedName,
      phone: cleanedPhone,
      businessType: businessType.trim() || undefined,
      businessName: businessName.trim() || undefined,
      consentAccepted: consent,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t("name.label")}
        type="text"
        placeholder={t("name.placeholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        maxLength={80}
        autoComplete="name"
      />
      <Input
        label={t("phone.label")}
        type="tel"
        placeholder={t("phone.placeholder")}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (phoneError) setPhoneError(undefined);
        }}
        required
        minLength={10}
        maxLength={16}
        autoComplete="tel"
        error={phoneError ?? demoLogin.error?.message}
      />
      <Input
        label={t("businessType.label")}
        type="text"
        placeholder={t("businessType.placeholder")}
        value={businessType}
        onChange={(e) => setBusinessType(e.target.value)}
        maxLength={60}
        autoComplete="organization-title"
      />
      <Input
        label={t("businessName.label")}
        type="text"
        placeholder={t("businessName.placeholder")}
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        maxLength={120}
        autoComplete="organization"
      />
      <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-slate-900"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>{t("consent")}</span>
      </label>
      <p className="text-xs text-slate-500">
        {t("whatsappHint", { number: DEMO_WHATSAPP_NUMBER })}
      </p>
      <Button
        type="submit"
        className="w-full h-12"
        isLoading={demoLogin.isPending}
        disabled={demoLogin.isPending}
      >
        {demoLogin.isPending ? t("entering") : t("submit")}
      </Button>
    </form>
  );
}
