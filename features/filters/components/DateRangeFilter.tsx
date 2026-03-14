"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, type DateRange } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDateFilterStore,
  DateFilterPreset,
} from "../stores/date-filter.store";

interface DateRangeFilterProps {
  variant?: "default" | "compact" | "minimal";
  showPresets?: boolean;
  availablePresets?: DateFilterPreset[];
}

const PRESET_LABELS: Record<DateFilterPreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  week: "Esta semana",
  last7days: "Últimos 7 días",
  month: "Este mes",
  custom: "Personalizado",
};

const PRESET_ICONS: Record<DateFilterPreset, string> = {
  today: "📅",
  yesterday: "📆",
  week: "📊",
  last7days: "📈",
  month: "📉",
  custom: "🔧",
};

export function DateRangeFilter({
  variant = "default",
  showPresets = true,
  availablePresets = ["today", "week", "month", "custom"],
}: DateRangeFilterProps) {
  const { preset, range, setPreset, setCustomRange } = useDateFilterStore();
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>({
    from: parseISO(range.from),
    to: parseISO(range.to),
  });

  // Formatear rango para mostrar
  const formatRangeDisplay = () => {
    if (preset !== "custom") {
      return PRESET_LABELS[preset];
    }

    const from = parseISO(range.from);
    const to = parseISO(range.to);

    if (range.from === range.to) {
      return format(from, "dd MMM", { locale: es });
    }

    return `${format(from, "dd MMM", { locale: es })} - ${format(to, "dd MMM", { locale: es })}`;
  };

  // Manejar selección de preset
  const handlePresetSelect = (newPreset: DateFilterPreset) => {
    setPreset(newPreset);
    setOpen(false); // Cerrar popover
  };

  // Abrir diálogo de calendario para rango personalizado
  const handleCustomClick = () => {
    setTempRange({
      from: parseISO(range.from),
      to: parseISO(range.to),
    });
    setShowCalendarDialog(true);
  };

  // Aplicar rango personalizado
  const handleApplyCustom = () => {
    if (tempRange?.from) {
      const fromStr = format(tempRange.from, "yyyy-MM-dd");
      const toStr = tempRange.to
        ? format(tempRange.to, "yyyy-MM-dd")
        : fromStr;

      setCustomRange({ from: fromStr, to: toStr });
      setShowCalendarDialog(false);
    }
  };

  // Estilos según variante
  const variantStyles = {
    default: "h-10 px-4 py-2",
    compact: "h-8 px-3 py-1 text-sm",
    minimal: "h-8 px-2 py-1 text-xs",
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between gap-2 font-normal",
              variantStyles[variant],
              "bg-white hover:bg-slate-50 border-slate-200"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">{formatRangeDisplay()}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          {showPresets && (
            <div className="space-y-1">
              {availablePresets.map((presetKey) => (
                <button
                  key={presetKey}
                  onClick={() => {
                    if (presetKey === "custom") {
                      handleCustomClick();
                      setOpen(false); // También cerrar para custom
                    } else {
                      handlePresetSelect(presetKey);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    preset === presetKey
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>{PRESET_ICONS[presetKey]}</span>
                  <span>{PRESET_LABELS[presetKey]}</span>
                  {preset === presetKey && (
                    <span className="ml-auto text-indigo-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Dialog del calendario para rango personalizado */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Seleccionar rango de fechas</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempRange?.from}
              selected={tempRange}
              onSelect={setTempRange}
              numberOfMonths={1}
            />
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="text-sm text-slate-600">
                {tempRange?.from ? (
                  tempRange?.to ? (
                    <>
                      <span className="font-medium text-slate-900">
                        {format(tempRange.from, "dd MMMM yyyy", { locale: es })}
                      </span>{" "}
                      hasta{" "}
                      <span className="font-medium text-slate-900">
                        {format(tempRange.to, "dd MMMM yyyy", { locale: es })}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium text-slate-900">
                      {format(tempRange.from, "dd MMMM yyyy", { locale: es })}
                    </span>
                  )
                ) : (
                  "Selecciona un rango de fechas"
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setTempRange({ from: today, to: today });
                  }}
                >
                  Hoy
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustom}
                  disabled={!tempRange?.from}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
