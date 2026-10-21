/**
 * WhatsAppAttentionCard
 * Modo de atención en coexistencia (F2): quién responde y cuándo el bot
 * se pausa. Guarda en el negocio: attentionMode, humanTakeoverMinutes y
 * attentionSchedule ([{day: 0-6, open/close "HH:MM"}]).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateBusiness } from "@/features/business";
import type { Business } from "@/features/business";

type Mode = "BOT_ONLY" | "ATTENTION_MANUAL" | "HYBRID";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface DayRow {
  enabled: boolean;
  open: string;
  close: string;
}

function scheduleFrom(
  schedule: Business["attentionSchedule"]
): DayRow[] {
  const rows: DayRow[] = DAY_KEYS.map(() => ({
    enabled: false,
    open: "08:00",
    close: "18:00",
  }));
  if (Array.isArray(schedule)) {
    for (const entry of schedule) {
      if (
        entry &&
        typeof entry.day === "number" &&
        entry.day >= 0 &&
        entry.day < 7
      ) {
        rows[entry.day] = {
          enabled: true,
          open: typeof entry.open === "string" ? entry.open : "08:00",
          close: typeof entry.close === "string" ? entry.close : "18:00",
        };
      }
    }
  }
  return rows;
}

export function WhatsAppAttentionCard({ business }: { business: Business }) {
  const t = useTranslations("whatsapp");
  const updateBusiness = useUpdateBusiness();

  const [mode, setMode] = useState<Mode>(business.attentionMode ?? "BOT_ONLY");
  const [minutes, setMinutes] = useState<string>(
    String(business.humanTakeoverMinutes ?? 15)
  );
  const [days, setDays] = useState<DayRow[]>(() =>
    scheduleFrom(business.attentionSchedule)
  );

  // Si llega otro negocio (o se recarga desde el servidor), sincronizar.
  // Ajustar estado durante el render —no en un efecto— para no pisar
  // ediciones sin guardar cuando otros paneles invalidan la query.
  const [syncedKey, setSyncedKey] = useState(
    `${business.id}@${business.updatedAt}`
  );
  const currentKey = `${business.id}@${business.updatedAt}`;
  if (syncedKey !== currentKey) {
    setSyncedKey(currentKey);
    setMode(business.attentionMode ?? "BOT_ONLY");
    setMinutes(String(business.humanTakeoverMinutes ?? 15));
    setDays(scheduleFrom(business.attentionSchedule));
  }

  const parsedMinutes = Number.parseInt(minutes, 10);
  const minutesValid =
    Number.isInteger(parsedMinutes) && parsedMinutes >= 1 && parsedMinutes <= 480;

  const handleSave = () => {
    if (!minutesValid) return;
    updateBusiness.mutate({
      businessId: business.id,
      data: {
        attentionMode: mode,
        humanTakeoverMinutes: parsedMinutes,
        attentionSchedule: days
          .map((row, day) => ({ day, ...row }))
          .filter((row) => row.enabled)
          .map(({ day, open, close }) => ({ day, open, close })),
      },
    });
  };

  const modes: Mode[] = ["BOT_ONLY", "HYBRID", "ATTENTION_MANUAL"];

  return (
    <div className="space-y-3 rounded-[14px] bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">
        {t("attention.title")}
      </p>
      <div className="flex flex-col gap-2">
        {modes.map((m) => (
          <label key={m} className="flex cursor-pointer items-start gap-2 text-sm">
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
        <div className="mt-2 space-y-1.5">
          {DAY_KEYS.map((dayKey, day) => (
            <div key={dayKey} className="flex items-center gap-2 text-sm">
              <label className="flex w-24 cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={days[day].enabled}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((row, i) =>
                        i === day ? { ...row, enabled: e.target.checked } : row
                      )
                    )
                  }
                />
                <span className="text-slate-700">{t(`attention.days.${dayKey}`)}</span>
              </label>
              <Input
                type="time"
                value={days[day].open}
                disabled={!days[day].enabled}
                onChange={(e) =>
                  setDays((prev) =>
                    prev.map((row, i) =>
                      i === day ? { ...row, open: e.target.value } : row
                    )
                  )
                }
                className="h-9 w-28 rounded-lg border-0 bg-slate-100 disabled:opacity-40"
              />
              <span className="text-slate-400">–</span>
              <Input
                type="time"
                value={days[day].close}
                disabled={!days[day].enabled}
                onChange={(e) =>
                  setDays((prev) =>
                    prev.map((row, i) =>
                      i === day ? { ...row, close: e.target.value } : row
                    )
                  )
                }
                className="h-9 w-28 rounded-lg border-0 bg-slate-100 disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={!minutesValid || updateBusiness.isPending}
        isLoading={updateBusiness.isPending}
        className="h-11 rounded-[14px] px-4 font-semibold"
      >
        {t("attention.save")}
      </Button>
    </div>
  );
}
