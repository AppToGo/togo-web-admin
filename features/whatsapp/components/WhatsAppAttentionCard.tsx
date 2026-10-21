/**
 * WhatsAppAttentionCard
 * Modo de atención en coexistencia (F2): quién responde y cuándo el bot
 * se pausa. Guarda en el negocio: attentionMode, humanTakeoverMinutes y
 * attentionSchedule ([{day: 0-6, open/close "HH:MM"}]).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateBusiness } from "@/features/business";
import type { Business } from "@/features/business";
import {
  AttentionScheduleEditor,
  rowValid,
  schedulePayload,
  scheduleRows,
  type AttentionMode,
  type DayRow,
} from "./AttentionScheduleEditor";

type Mode = AttentionMode;

/** Huella de lo que esta tarjeta edita, tal como está en el servidor. */
function serverKey(business: Business): string {
  return JSON.stringify([
    business.id,
    business.attentionMode ?? "BOT_ONLY",
    business.humanTakeoverMinutes ?? 15,
    business.attentionSchedule ?? null,
  ]);
}

export function WhatsAppAttentionCard({ business }: { business: Business }) {
  const t = useTranslations("whatsapp");
  const updateBusiness = useUpdateBusiness();

  const [mode, setMode] = useState<Mode>(business.attentionMode ?? "BOT_ONLY");
  const [minutes, setMinutes] = useState<string>(
    String(business.humanTakeoverMinutes ?? 15)
  );
  const [days, setDays] = useState<DayRow[]>(() =>
    scheduleRows(business.attentionSchedule)
  );

  // Si llega otro negocio o cambian en el servidor los campos de esta
  // tarjeta, sincronizar. La clave son esos campos y no `updatedAt`: guardar
  // otro panel del negocio no debe pisar las ediciones sin guardar de acá.
  // Ajustar estado durante el render, no en un efecto.
  const [syncedKey, setSyncedKey] = useState(() => serverKey(business));
  const currentKey = serverKey(business);
  if (syncedKey !== currentKey) {
    setSyncedKey(currentKey);
    setMode(business.attentionMode ?? "BOT_ONLY");
    setMinutes(String(business.humanTakeoverMinutes ?? 15));
    setDays(scheduleRows(business.attentionSchedule));
  }

  const parsedMinutes = Number.parseInt(minutes, 10);
  const minutesValid =
    Number.isInteger(parsedMinutes) &&
    parsedMinutes >= 1 &&
    parsedMinutes <= 480;

  // Sin días marcados no hay horario propio: en híbrido rige el horario
  // comercial de las sedes (la API lo hereda vía StoreStatusService).
  const rangesValid = days.every(rowValid);
  const canSave = minutesValid && rangesValid;

  const handleSave = () => {
    if (!canSave) return;
    updateBusiness.mutate(
      {
        businessId: business.id,
        data: {
          attentionMode: mode,
          humanTakeoverMinutes: parsedMinutes,
          attentionSchedule: schedulePayload(days),
        },
      },
      {
        onSuccess: () => toast.success(t("attention.saveSuccess")),
        onError: () => toast.error(t("attention.saveError")),
      }
    );
  };

  const modes: Mode[] = ["BOT_ONLY", "HYBRID", "ATTENTION_MANUAL"];

  return (
    <div className="space-y-3 rounded-[14px] bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">
        {t("attention.title")}
      </p>
      <div className="flex flex-col gap-2">
        {modes.map((m) => (
          <label
            key={m}
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              type="radio"
              name="attention-mode"
              value={m}
              checked={mode === m}
              onChange={() => setMode(m)}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-slate-800">
                {t(`attention.modes.${m}.label`)}
              </span>
              <span className="block text-xs text-slate-500">
                {t(`attention.modes.${m}.hint`)}
              </span>
            </span>
          </label>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-800">
          {t("attention.minutesLabel")}
        </span>
        <Input
          type="number"
          min={1}
          max={480}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="mt-1 h-11 rounded-[14px] border-0 bg-slate-100"
        />
      </label>
      {!minutesValid && (
        <p className="text-xs text-red-600">{t("attention.minutesError")}</p>
      )}

      <div>
        <p className="text-sm font-medium text-slate-800">
          {t("attention.scheduleLabel")}
        </p>
        <p className="text-xs text-slate-500">{t("attention.scheduleHint")}</p>
        <AttentionScheduleEditor days={days} onChange={setDays} />
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={!canSave || updateBusiness.isPending}
        isLoading={updateBusiness.isPending}
        className="h-11 rounded-[14px] px-4 font-semibold"
      >
        {t("attention.save")}
      </Button>
    </div>
  );
}
