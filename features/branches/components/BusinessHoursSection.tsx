"use client";

import { useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { BusinessHours, BusinessHoursErrors, DayKey } from "../types";
import { BUSINESS_HOURS_DAYS, createEmptyBusinessHours } from "../types";

interface BusinessHoursSectionProps {
  /** `null` = sede sin horario (acepta pedidos siempre) */
  value: BusinessHours | null;
  onChange: (hours: BusinessHours | null) => void;
  /** Zona horaria de la sede, usada al activar el horario por primera vez */
  timezone?: string;
  errors?: BusinessHoursErrors | null;
}

/**
 * Horario de atención de la sede.
 *
 * Mismo patrón que DineInConfigSection: un switch maestro que revela el
 * formulario. Apagado = `null`, que el backend guarda como `{}` y el bot
 * trata como SIN_CONFIGURAR (acepta pedidos a cualquier hora). Al
 * activarlo, todos los días arrancan cerrados y sin horas para que el
 * negocio elija uno a uno los que atiende — nunca se asume un horario.
 */
export function BusinessHoursSection({
  value,
  onChange,
  timezone,
  errors,
}: BusinessHoursSectionProps) {
  const t = useTranslations("branches.settings.businessHours");
  const id = useId();

  // Último horario escrito, para no perderlo si el usuario apaga y vuelve a
  // prender el switch en la misma edición.
  const lastValueRef = useRef<BusinessHours | null>(null);

  const handleEnabledChange = (checked: boolean) => {
    if (!checked) {
      lastValueRef.current = value;
      onChange(null);
      return;
    }
    onChange(
      lastValueRef.current ?? createEmptyBusinessHours(timezone || "America/Bogota")
    );
  };

  const updateDay = (
    hours: BusinessHours,
    day: DayKey,
    patch: Partial<BusinessHours["schedule"][DayKey]>
  ) => {
    onChange({
      ...hours,
      schedule: {
        ...hours.schedule,
        [day]: { ...hours.schedule[day], ...patch },
      },
    });
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription className="mt-1">{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <Label htmlFor={`${id}-enabled`} className="font-medium cursor-pointer">
              {t("enable")}
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">{t("enableDescription")}</p>
          </div>
          <Switch
            id={`${id}-enabled`}
            checked={value !== null}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {value === null ? (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                {t("notConfigured")}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("notConfiguredDescription")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-timezone`}>{t("timezone")}</Label>
              <Input
                id={`${id}-timezone`}
                value={value.timezone}
                onChange={(e) => onChange({ ...value, timezone: e.target.value })}
                placeholder="America/Bogota"
              />
            </div>

            <p className="text-sm text-slate-500">{t("daysHelp")}</p>

            {errors?.noOpenDays && (
              <p className="text-sm text-red-600" role="alert">
                {t("errors.noOpenDays")}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUSINESS_HOURS_DAYS.map((day) => {
                const daySchedule = value.schedule[day];
                const dayLabel = t(`days.${day}`);
                const dayError = errors?.days?.[day];
                return (
                  <div key={day} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`${id}-${day}-open`}
                        checked={daySchedule.isOpen}
                        onCheckedChange={(checked) =>
                          updateDay(value, day, { isOpen: checked })
                        }
                      />
                      <Label
                        htmlFor={`${id}-${day}-open`}
                        className="w-24 font-medium cursor-pointer"
                      >
                        {dayLabel}
                      </Label>

                      {daySchedule.isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            aria-label={t("openTime", { day: dayLabel })}
                            value={daySchedule.open}
                            onChange={(e) =>
                              updateDay(value, day, { open: e.target.value })
                            }
                          />
                          <span className="text-slate-400">-</span>
                          <Input
                            type="time"
                            aria-label={t("closeTime", { day: dayLabel })}
                            value={daySchedule.close}
                            onChange={(e) =>
                              updateDay(value, day, { close: e.target.value })
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-slate-500 flex-1">{t("closed")}</span>
                      )}
                    </div>
                    {daySchedule.isOpen && dayError && (
                      <p className="text-xs text-red-600" role="alert">
                        {t(`errors.${dayError}`)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
