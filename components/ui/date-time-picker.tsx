"use client";

/**
 * Selector de fecha y hora: el `Calendar` del panel (el del filtro de
 * fechas) en un popover, con atajos de día y hora y un campo de hora como
 * el de los horarios de sede. El valor es un ISO string ("" = sin fecha);
 * con `name` además viaja en un input oculto para formularios con FormData.
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const QUICK_TIMES = ["09:00", "12:00", "15:00", "18:00"];
const DEFAULT_TIME = "09:00";

interface DateTimePickerProps {
  id: string;
  label: string;
  name?: string;
  /** Controlado: ISO string o "". */
  value?: string;
  onChange?: (iso: string) => void;
  /** No controlado. */
  defaultValue?: string | null;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const timeOf = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function withTime(day: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const next = new Date(day);
  next.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return next;
}

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DateTimePicker({
  id,
  label,
  name,
  value,
  onChange,
  defaultValue,
  disabled,
}: DateTimePickerProps) {
  const t = useTranslations("common");
  const [inner, setInner] = useState(
    () => parseIso(defaultValue)?.toISOString() ?? ""
  );
  const current = value ?? inner;
  const selected = parseIso(current);

  const [open, setOpen] = useState(false);
  // Borrador mientras el popover está abierto; se confirma con "Aplicar".
  const [draftDay, setDraftDay] = useState<Date | undefined>(
    selected ?? undefined
  );
  const [draftTime, setDraftTime] = useState(
    selected ? timeOf(selected) : DEFAULT_TIME
  );

  const commit = (iso: string) => {
    setInner(iso);
    onChange?.(iso);
  };

  const openChange = (next: boolean) => {
    if (next) {
      setDraftDay(selected ?? undefined);
      setDraftTime(selected ? timeOf(selected) : DEFAULT_TIME);
    }
    setOpen(next);
  };

  const today = new Date();
  const tomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );
  const isSameDay = (a: Date | undefined, b: Date) =>
    !!a && a.toDateString() === b.toDateString();

  const chip = (on: boolean) =>
    cn(
      "h-8 rounded-full px-3 text-[13px] font-semibold transition-colors",
      on
        ? "bg-indigo-600 text-white"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    );

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {name && <input type="hidden" name={name} value={current} />}
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-11 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-left text-sm transition-colors",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "text-slate-900" : "text-slate-500"
            )}
          >
            <CalendarIcon
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden
            />
            <span className="truncate">
              {selected
                ? format(selected, "EEE d MMM yyyy · HH:mm", { locale: es })
                : t("dateTime.placeholder")}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex gap-2 px-3 pt-3">
            <button
              type="button"
              className={chip(isSameDay(draftDay, today))}
              onClick={() => setDraftDay(today)}
            >
              {t("time.today")}
            </button>
            <button
              type="button"
              className={chip(isSameDay(draftDay, tomorrow))}
              onClick={() => setDraftDay(tomorrow)}
            >
              {t("time.tomorrow")}
            </button>
          </div>
          <Calendar
            mode="single"
            selected={draftDay}
            onSelect={setDraftDay}
            defaultMonth={draftDay ?? today}
          />
          <div className="space-y-2 border-t border-slate-100 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={`${id}-time`}
                className="text-sm font-medium text-slate-700"
              >
                {t("dateTime.time")}
              </label>
              <input
                id={`${id}-time`}
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value || DEFAULT_TIME)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={chip(draftTime === time)}
                  onClick={() => setDraftTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5">
            <button
              type="button"
              onClick={() => {
                commit("");
                setOpen(false);
              }}
              className="h-9 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {t("buttons.remove")}
            </button>
            <button
              type="button"
              disabled={!draftDay}
              onClick={() => {
                if (!draftDay) return;
                commit(withTime(draftDay, draftTime).toISOString());
                setOpen(false);
              }}
              className="h-9 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t("buttons.apply")}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
