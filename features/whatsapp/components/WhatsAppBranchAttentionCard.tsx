/**
 * WhatsAppBranchAttentionCard
 * Atención por sede (F5): modo, minutos de takeover y horario propios de la
 * sede, con herencia del negocio. `null` en el servidor = heredar.
 * - Número exclusivo (DIRECT_TO_BRANCH): la pausa y el operador ocupado se
 *   evalúan solo en esta sede; sin horario propio rige su horario comercial.
 * - Número compartido: el horario y el operador ocupado se evalúan a nivel
 *   del negocio.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusiness } from "@/features/business";
import { useUpdateBranch } from "@/features/branches";
import type { Branch } from "@/features/branches/types";

type Mode = "BOT_ONLY" | "ATTENTION_MANUAL" | "HYBRID";
type ModeOrInherit = Mode | "INHERIT";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface DayRow {
  enabled: boolean;
  open: string;
  close: string;
}

function scheduleFrom(
  schedule: Branch["attentionSchedule"]
): { own: boolean; rows: DayRow[] } {
  const rows: DayRow[] = DAY_KEYS.map(() => ({
    enabled: false,
    open: "08:00",
    close: "18:00",
  }));
  if (!Array.isArray(schedule)) return { own: false, rows };
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
  return { own: true, rows };
}

/** Huella de lo que esta tarjeta edita, tal como está en el servidor. */
function serverKey(branch: Branch): string {
  return JSON.stringify([
    branch.id,
    branch.attentionMode ?? null,
    branch.humanTakeoverMinutes ?? null,
    branch.attentionSchedule ?? null,
  ]);
}

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Día marcado con horas válidas y cierre después de la apertura. */
function rowValid(row: DayRow): boolean {
  return (
    !row.enabled ||
    (HH_MM.test(row.open) && HH_MM.test(row.close) && row.open < row.close)
  );
}

const MODE_LABEL: Record<Mode, string> = {
  BOT_ONLY: "attention.modes.BOT_ONLY.label",
  HYBRID: "attention.modes.HYBRID.label",
  ATTENTION_MANUAL: "attention.modes.ATTENTION_MANUAL.label",
};

export function WhatsAppBranchAttentionCard({
  branch,
  dedicated,
}: {
  branch: Branch;
  dedicated: boolean;
}) {
  const t = useTranslations("whatsapp");
  const updateBranch = useUpdateBranch();
  const { data: business } = useBusiness(branch.businessId);

  const initial = scheduleFrom(branch.attentionSchedule);
  const [mode, setMode] = useState<ModeOrInherit>(
    branch.attentionMode ?? "INHERIT"
  );
  const [minutes, setMinutes] = useState<string>(
    branch.humanTakeoverMinutes != null
      ? String(branch.humanTakeoverMinutes)
      : ""
  );
  const [ownSchedule, setOwnSchedule] = useState(initial.own);
  const [days, setDays] = useState<DayRow[]>(initial.rows);

  // Sincronizar si cambian en el servidor los campos de esta tarjeta.
  // Ajustar estado durante el render, no en un efecto.
  const [syncedKey, setSyncedKey] = useState(() => serverKey(branch));
  const currentKey = serverKey(branch);
  if (syncedKey !== currentKey) {
    setSyncedKey(currentKey);
    setMode(branch.attentionMode ?? "INHERIT");
    setMinutes(
      branch.humanTakeoverMinutes != null
        ? String(branch.humanTakeoverMinutes)
        : ""
    );
    const next = scheduleFrom(branch.attentionSchedule);
    setOwnSchedule(next.own);
    setDays(next.rows);
  }

  // Modo efectivo: propio o heredado (para validar el horario).
  const inheritedMode: Mode = business?.attentionMode ?? "BOT_ONLY";
  const effectiveMode: Mode = mode === "INHERIT" ? inheritedMode : mode;

  const trimmedMinutes = minutes.trim();
  const parsedMinutes =
    trimmedMinutes === "" ? null : Number.parseInt(trimmedMinutes, 10);
  const minutesValid =
    parsedMinutes === null ||
    (Number.isInteger(parsedMinutes) &&
      parsedMinutes >= 1 &&
      parsedMinutes <= 480);

  const updateDay = (day: number, patch: Partial<DayRow>) =>
    setDays((prev) =>
      prev.map((row, i) => (i === day ? { ...row, ...patch } : row))
    );

  // Con horario propio en híbrido se exige al menos un día, igual que en el
  // negocio: "día sin marcar = cerrado" debe ser cierto.
  const scheduleEmpty =
    effectiveMode === "HYBRID" &&
    ownSchedule &&
    !days.some((row) => row.enabled);
  const rangesValid = days.every(rowValid);
  const canSave = minutesValid && (!ownSchedule || rangesValid) && !scheduleEmpty;

  const handleSave = () => {
    if (!canSave) return;
    updateBranch.mutate(
      {
        branchId: branch.id,
        data: {
          attentionMode: mode === "INHERIT" ? null : mode,
          humanTakeoverMinutes: parsedMinutes,
          attentionSchedule: !ownSchedule
            ? null
            : days
                .map((row, day) => ({ day, ...row }))
                .filter((row) => row.enabled)
                .map(({ day, open, close }) => ({ day, open, close })),
        },
      },
      {
        onSuccess: () => toast.success(t("attention.saveSuccess")),
        onError: () => toast.error(t("attention.saveError")),
      }
    );
  };

  const modes: ModeOrInherit[] = [
    "INHERIT",
    "BOT_ONLY",
    "HYBRID",
    "ATTENTION_MANUAL",
  ];

  return (
    <div className="space-y-3 rounded-[14px] bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">
        {t("branchAttention.title")}
      </p>
      <p className="text-xs text-slate-500">
        {dedicated ? t("branchAttention.dedicatedHint") : t("branchAttention.sharedHint")}
      </p>
      <div className="flex flex-col gap-2">
        {modes.map((m) => (
          <label
            key={m}
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              type="radio"
              name={`attention-mode-${branch.id}`}
              value={m}
              checked={mode === m}
              onChange={() => setMode(m)}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-slate-800">
                {m === "INHERIT"
                  ? t("branchAttention.inheritMode", {
                      mode: t(MODE_LABEL[inheritedMode]),
                    })
                  : t(`attention.modes.${m}.label`)}
              </span>
              {m !== "INHERIT" && (
                <span className="block text-xs text-slate-500">
                  {t(`attention.modes.${m}.hint`)}
                </span>
              )}
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
          placeholder={String(business?.humanTakeoverMinutes ?? 15)}
          onChange={(e) => setMinutes(e.target.value)}
          className="mt-1 h-11 rounded-[14px] border-0 bg-slate-100"
        />
        <span className="mt-1 block text-xs text-slate-500">
          {t("branchAttention.inheritMinutes")}
        </span>
      </label>
      {!minutesValid && (
        <p className="text-xs text-red-600">{t("attention.minutesError")}</p>
      )}

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={ownSchedule}
            onChange={(e) => setOwnSchedule(e.target.checked)}
          />
          {t("branchAttention.ownSchedule")}
        </label>
        {!ownSchedule ? (
          <p className="mt-1 text-xs text-slate-500">
            {dedicated
              ? t("branchAttention.inheritScheduleDedicated")
              : t("branchAttention.inheritScheduleShared")}
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-500">
              {t("attention.scheduleHint")}
            </p>
            <div className="mt-2 space-y-1.5">
              {DAY_KEYS.map((dayKey, day) => (
                <div key={dayKey} className="flex items-center gap-2 text-sm">
                  <label className="flex w-24 cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={days[day].enabled}
                      onChange={(e) =>
                        updateDay(day, { enabled: e.target.checked })
                      }
                    />
                    <span className="text-slate-700">
                      {t(`attention.days.${dayKey}`)}
                    </span>
                  </label>
                  <Input
                    type="time"
                    value={days[day].open}
                    disabled={!days[day].enabled}
                    onChange={(e) => updateDay(day, { open: e.target.value })}
                    className="h-9 w-28 rounded-lg border-0 bg-slate-100 disabled:opacity-40"
                  />
                  <span className="text-slate-400">–</span>
                  <Input
                    type="time"
                    value={days[day].close}
                    disabled={!days[day].enabled}
                    onChange={(e) => updateDay(day, { close: e.target.value })}
                    className="h-9 w-28 rounded-lg border-0 bg-slate-100 disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
            {ownSchedule && !rangesValid && (
              <p className="mt-1.5 text-xs text-red-600">
                {t("attention.rangeError")}
              </p>
            )}
            {scheduleEmpty && (
              <p className="mt-1.5 text-xs text-red-600">
                {t("attention.scheduleEmptyError")}
              </p>
            )}
          </>
        )}
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={!canSave || updateBranch.isPending}
        isLoading={updateBranch.isPending}
        className="h-11 rounded-[14px] px-4 font-semibold"
      >
        {t("attention.save")}
      </Button>
    </div>
  );
}
