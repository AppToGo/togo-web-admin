/**
 * WhatsAppBranchAttentionCard
 * Atención por sede (F5): modo, minutos de takeover y horario propios de la
 * sede, con herencia del negocio. `null` en el servidor = heredar.
 * - Número exclusivo (`dedicatedBranchIds`): la pausa y el operador ocupado
 *   se evalúan solo en esta sede; sin horario propio rige su horario
 *   comercial.
 * - Número propio "solo API" o número compartido: rige la atención del
 *   negocio y la sede no tiene nada que configurar (la API ignora su
 *   config), así que solo se explica por qué.
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
import {
  AttentionScheduleEditor,
  hasOwnSchedule,
  rowValid,
  schedulePayload,
  scheduleRows,
  type AttentionMode,
  type DayRow,
} from "./AttentionScheduleEditor";

type Mode = AttentionMode;
type ModeOrInherit = Mode | "INHERIT";

/** Huella de lo que esta tarjeta edita, tal como está en el servidor. */
function serverKey(branch: Branch): string {
  return JSON.stringify([
    branch.id,
    branch.attentionMode ?? null,
    branch.humanTakeoverMinutes ?? null,
    branch.attentionSchedule ?? null,
  ]);
}

const MODE_LABEL: Record<Mode, string> = {
  BOT_ONLY: "attention.modes.BOT_ONLY.label",
  HYBRID: "attention.modes.HYBRID.label",
  ATTENTION_MANUAL: "attention.modes.ATTENTION_MANUAL.label",
};

export function WhatsAppBranchAttentionCard({
  branch,
  dedicated,
  ownNumber = false,
}: {
  branch: Branch;
  dedicated: boolean;
  /** Tiene número propio aunque no sea de coexistencia. */
  ownNumber?: boolean;
}) {
  const t = useTranslations("whatsapp");
  const updateBranch = useUpdateBranch();
  const { data: business } = useBusiness(branch.businessId);

  const [mode, setMode] = useState<ModeOrInherit>(
    branch.attentionMode ?? "INHERIT"
  );
  const [minutes, setMinutes] = useState<string>(
    branch.humanTakeoverMinutes != null
      ? String(branch.humanTakeoverMinutes)
      : ""
  );
  // Vacío o null = heredar, igual que en la API (`explicit()`).
  const [ownSchedule, setOwnSchedule] = useState(() =>
    hasOwnSchedule(branch.attentionSchedule)
  );
  const [days, setDays] = useState<DayRow[]>(() =>
    scheduleRows(branch.attentionSchedule)
  );

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
    setOwnSchedule(hasOwnSchedule(branch.attentionSchedule));
    setDays(scheduleRows(branch.attentionSchedule));
  }

  const inheritedMode: Mode = business?.attentionMode ?? "BOT_ONLY";

  const trimmedMinutes = minutes.trim();
  const parsedMinutes =
    trimmedMinutes === "" ? null : Number.parseInt(trimmedMinutes, 10);
  const minutesValid =
    parsedMinutes === null ||
    (Number.isInteger(parsedMinutes) &&
      parsedMinutes >= 1 &&
      parsedMinutes <= 480);

  // Horario propio sin días se guardaría como [] y la API lo trata como
  // heredar: se exige al menos un día, o desmarcar "horario propio".
  const scheduleEmpty = ownSchedule && !days.some((row) => row.enabled);
  const rangesValid = days.every(rowValid);
  const canSave =
    minutesValid && (!ownSchedule || rangesValid) && !scheduleEmpty;

  const handleSave = () => {
    if (!canSave) return;
    updateBranch.mutate(
      {
        branchId: branch.id,
        data: {
          attentionMode: mode === "INHERIT" ? null : mode,
          humanTakeoverMinutes: parsedMinutes,
          attentionSchedule: ownSchedule ? schedulePayload(days) : null,
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

  if (!dedicated) {
    return (
      <div className="space-y-1 rounded-[14px] bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">
          {t("branchAttention.title")}
        </p>
        <p className="text-xs text-slate-500">
          {ownNumber
            ? t("branchAttention.cloudOnlyHint")
            : t("branchAttention.sharedHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[14px] bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">
        {t("branchAttention.title")}
      </p>
      <p className="text-xs text-slate-500">
        {t("branchAttention.dedicatedHint")}
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
            {t("branchAttention.inheritScheduleDedicated")}
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-500">
              {t("attention.scheduleHint")}
            </p>
            <AttentionScheduleEditor days={days} onChange={setDays} />
            {scheduleEmpty && (
              <p className="mt-1.5 text-xs text-red-600">
                {t("branchAttention.ownScheduleEmptyError")}
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
