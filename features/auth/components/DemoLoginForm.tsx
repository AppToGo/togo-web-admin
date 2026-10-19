"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoLogin } from "@/features/auth/hooks/useAuth";
import { DEMO_WHATSAPP_NUMBER } from "@/features/auth/demo.constants";

/**
 * Entrada al modo demo desde el login.
 *
 * Colapsado muestra solo el botón "Probar el panel sin registrarte"; al
 * abrirlo pide nombre + WhatsApp (el visitante solo podrá responder las
 * conversaciones que lleguen desde ese número) con aviso de contacto
 * comercial, y le indica a qué número escribir para vivir el inbox.
 */
export function DemoLoginForm() {
  const t = useTranslations("auth.login.demo");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const demoLogin = useDemoLogin();

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full h-12"
        onClick={() => setOpen(true)}
      >
        {t("tryButton")}
      </Button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    demoLogin.mutate({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-900 mb-1">{t("title")}</p>
      <p className="text-xs text-slate-500 mb-4">{t("subtitle")}</p>
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
          error={demoLogin.error?.message}
        />
        <Input
          label={t("phone.label")}
          type="tel"
          placeholder={t("phone.placeholder")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
        <p className="text-xs text-slate-500">{t("consent")}</p>
        <p className="text-xs text-slate-500">
          {t("whatsappHint", { number: DEMO_WHATSAPP_NUMBER })}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-12"
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12"
            isLoading={demoLogin.isPending}
            disabled={demoLogin.isPending}
          >
            {demoLogin.isPending ? t("entering") : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
