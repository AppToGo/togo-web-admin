"use client";

/**
 * CreateLeadDrawer
 * Alta manual de un posible cliente (alguien que contactó al super admin o
 * un referido). Se guarda con el número del negocio demo: si esa persona
 * después prueba la demo, cae en esta misma ficha.
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput, PHONE_REGEX } from "@/components/ui/phone-input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { IndustrySelect } from "@/features/auth/components/IndustrySelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { DemoLeadPriority, DemoLeadStage } from "@/types/auth.types";
import {
  existingLeadIdOf,
  useCreateDemoLead,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";
import {
  DEMO_LEAD_PRIORITIES,
  OPEN_DEMO_LEAD_STAGES,
  parseOptionalIsoDateTime,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

interface CreateLeadDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Abre la ficha de un lead (el creado, o el que ya tenía ese número). */
  onOpenLead: (id: string) => void;
}

export function CreateLeadDrawer({
  open,
  onClose,
  onOpenLead,
}: CreateLeadDrawerProps) {
  const t = useTranslations("admin-demo-leads");
  const createLead = useCreateDemoLead();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string>();
  const [existingId, setExistingId] = useState<string | null>(null);

  const close = () => {
    setPhone("");
    setPhoneError(undefined);
    setExistingId(null);
    createLead.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError(t("create.phoneInvalid"));
      return;
    }
    const form = new FormData(e.currentTarget);
    const text = (key: string) =>
      ((form.get(key) as string | null) ?? "").trim() || undefined;

    setExistingId(null);
    createLead.mutate(
      {
        name: text("name"),
        phone,
        businessName: text("businessName"),
        businessType: text("businessType"),
        referredBy: text("referredBy"),
        stage: form.get("stage") as DemoLeadStage,
        priority: form.get("priority") as DemoLeadPriority,
        nextAction: text("nextAction"),
        nextActionAt:
          parseOptionalIsoDateTime(form.get("nextActionAt")) ?? undefined,
        note: text("note"),
        consentGiven: form.get("consentGiven") === "on",
      },
      {
        onSuccess: (lead) => {
          close();
          onOpenLead(lead.id);
        },
        onError: (error) => setExistingId(existingLeadIdOf(error)),
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={(next) => !next && close()}>
      <DrawerContent>
        <DrawerHeader className="border-b border-slate-100/80 px-6 pb-4 pt-6">
          <DrawerTitle className="pr-10 text-xl font-bold text-slate-900">
            {t("create.title")}
          </DrawerTitle>
          <p className="pr-10 text-sm text-slate-500">{t("create.subtitle")}</p>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {existingId && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    {t("create.duplicateTitle")}
                  </p>
                  <p className="mt-0.5 text-sm text-amber-800">
                    {t("create.duplicateHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const id = existingId;
                    close();
                    onOpenLead(id);
                  }}
                >
                  {t("create.openExisting")}
                </Button>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">
                {t("create.contactSection")}
              </h3>
              <Input
                label={t("create.name")}
                name="name"
                minLength={2}
                maxLength={80}
                placeholder={t("create.namePlaceholder")}
                autoComplete="off"
              />
              <PhoneInput
                id="create-lead-phone"
                label={t("create.phone")}
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setPhoneError(undefined);
                  setExistingId(null);
                }}
                required
                error={phoneError}
                helperText={t("create.phoneHint")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("detail.businessName")}
                  name="businessName"
                  maxLength={120}
                />
                <IndustrySelect
                  id="create-lead-business-type"
                  label={t("detail.businessType")}
                  name="businessType"
                />
              </div>
              <Input
                label={t("create.referredBy")}
                name="referredBy"
                maxLength={120}
                placeholder={t("create.referredByPlaceholder")}
              />
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">
                {t("create.followUpSection")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-slate-600">
                  <span>{t("detail.stage")}</span>
                  <Select name="stage" defaultValue="TO_CONTACT">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Un lead nuevo no nace cerrado */}
                      {OPEN_DEMO_LEAD_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {t(`stages.${stage}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-1 text-xs text-slate-600">
                  <span>{t("detail.priority")}</span>
                  <Select name="priority" defaultValue="NORMAL">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_LEAD_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(`filters.priority.${p}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("detail.nextAction")}
                  name="nextAction"
                  maxLength={255}
                />
                <DateTimePicker
                  id="create-lead-next-action-at"
                  label={t("detail.nextActionAt")}
                  name="nextActionAt"
                />
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  {t("create.note")}
                </span>
                <Textarea
                  name="note"
                  rows={3}
                  maxLength={2000}
                  placeholder={t("create.notePlaceholder")}
                />
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white/70 p-3.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="consentGiven"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                />
                <span>
                  <span className="font-medium text-slate-900">
                    {t("create.consent")}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {t("create.consentHint")}
                  </span>
                </span>
              </label>
            </section>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100/80 px-6 py-4">
            <Button type="button" variant="ghost" onClick={close}>
              {t("detail.cancel")}
            </Button>
            <Button
              type="submit"
              className="ml-auto"
              isLoading={createLead.isPending}
              disabled={createLead.isPending}
            >
              {createLead.isPending ? t("create.saving") : t("create.submit")}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
