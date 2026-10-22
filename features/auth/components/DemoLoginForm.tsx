"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput, PHONE_REGEX } from "@/components/ui/phone-input";
import { useDemoLogin } from "@/features/auth/hooks/useAuth";
import { IndustrySelect } from "@/features/auth/components/IndustrySelect";
import { DEMO_WHATSAPP_NUMBER } from "@/features/auth/demo.constants";

/**
 * Formulario de entrada al modo demo.
 *
 * Pide nombre + WhatsApp (con selector de país y bandera), tipo de negocio
 * compartido con el registro (/industries), nombre del negocio y
 * consentimiento de contacto comercial.
 */
export function DemoLoginForm() {
  const t = useTranslations("auth.login.demo");
  const tRegister = useTranslations("auth.register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [consent, setConsent] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [consentError, setConsentError] = useState<string | undefined>();
  const demoLogin = useDemoLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const cleanedPhone = phone.replace(/[\s()-]/g, "").trim();

    if (!PHONE_REGEX.test(cleanedPhone)) {
      setPhoneError(t("phone.invalid"));
      return;
    }

    if (!consent) {
      setConsentError(t("consentRequired"));
      return;
    }

    setPhoneError(undefined);
    setConsentError(undefined);
    demoLogin.mutate({
      name: trimmedName,
      phone: cleanedPhone,
      businessType: businessType.trim() || undefined,
      businessName: businessName.trim() || undefined,
      consentAccepted: true,
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
        disabled={demoLogin.isPending}
      />

      <PhoneInput
        id="demo-phone-input"
        label={t("phone.label")}
        value={phone}
        onChange={(val) => {
          setPhone(val);
          if (phoneError) setPhoneError(undefined);
        }}
        required
        disabled={demoLogin.isPending}
        error={phoneError ?? demoLogin.error?.message}
      />

      <IndustrySelect
        id="demo-business-type"
        label={t("businessType.label")}
        value={businessType}
        onChange={setBusinessType}
        disabled={demoLogin.isPending}
        helperText={tRegister("industry.helper")}
      />

      <Input
        label={t("businessName.label")}
        type="text"
        placeholder={t("businessName.placeholder")}
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        maxLength={120}
        autoComplete="organization"
        disabled={demoLogin.isPending}
      />

      <div className="space-y-1">
        <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-slate-900"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked && consentError) {
                setConsentError(undefined);
              }
            }}
            required
            disabled={demoLogin.isPending}
          />
          <span>{t("consent")}</span>
        </label>
        {consentError && <p className="text-xs text-red-500">{consentError}</p>}
      </div>

      <p className="text-xs text-slate-500">
        {t("whatsappHint", { number: DEMO_WHATSAPP_NUMBER })}
      </p>

      <Button
        type="submit"
        className="w-full h-12"
        isLoading={demoLogin.isPending}
        disabled={!consent || demoLogin.isPending}
      >
        {demoLogin.isPending ? t("entering") : t("submit")}
      </Button>
    </form>
  );
}
