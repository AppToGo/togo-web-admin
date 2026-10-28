"use client";

/**
 * Agregar la próxima acción de un lead desde un modal (el "+" de la tarjeta
 * del tablero o el botón de la pestaña Seguimiento). Qué hay que hacer, con
 * sugerencias rápidas, y cuándo, con atajos de fecha o una fecha propia.
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useDemoLeadActions } from "../hooks/useDemoLeads";

const SUGGESTIONS = ["call", "whatsapp", "proposal", "meeting"] as const;
const PRESETS = ["today", "tomorrow", "in3days", "none"] as const;
type Preset = (typeof PRESETS)[number] | "custom";

/** Fecha de un atajo: hoy a las 18:00 (o en 1 h si ya pasó), mañana o en 3 días a las 9:00. */
function presetDate(preset: Preset, now: Date = new Date()): string {
  if (preset === "none" || preset === "custom") return "";
  const date = new Date(now);
  if (preset === "today") {
    date.setHours(18, 0, 0, 0);
    if (date <= now) {
      date.setTime(now.getTime() + 60 * 60 * 1000);
      date.setMinutes(0, 0, 0);
    }
    return date.toISOString();
  }
  date.setDate(date.getDate() + (preset === "tomorrow" ? 1 : 3));
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

interface LeadActionDialogProps {
  lead: { id: string; name?: string | null };
  isOpen: boolean;
  onClose: () => void;
}

export function LeadActionDialog({ lead, isOpen, onClose }: LeadActionDialogProps) {
  const t = useTranslations("admin-demo-leads");
  const { add } = useDemoLeadActions(lead.id);
  const [title, setTitle] = useState("");
  const [preset, setPreset] = useState<Preset>("tomorrow");
  const [dueAt, setDueAt] = useState(() => presetDate("tomorrow"));

  const pickPreset = (next: Preset) => {
    setPreset(next);
    setDueAt(presetDate(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    add.mutate(
      { title: text, ...(dueAt ? { dueAt } : {}) },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t("actionDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("actionDialog.description", {
              name: lead.name || t("card.noName"),
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-7 pb-7 pt-5">
          <div className="space-y-2">
            <Input
              label={t("actionDialog.what")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("actionDialog.whatPlaceholder")}
              maxLength={255}
              autoFocus
            />
            <div
              role="group"
              aria-label={t("actionDialog.suggestionsLabel")}
              className="flex flex-wrap gap-1.5"
            >
              {SUGGESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTitle(t(`actionDialog.suggestions.${key}`))}
                  className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700"
                >
                  {t(`actionDialog.suggestions.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              {t("actionDialog.when")}
            </span>
            <div
              role="group"
              aria-label={t("actionDialog.when")}
              className="grid grid-cols-4 gap-1.5"
            >
              {PRESETS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={preset === key}
                  onClick={() => pickPreset(key)}
                  className={cn(
                    "h-9 rounded-xl border text-[13px] transition-colors",
                    preset === key
                      ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {t(`actionDialog.presets.${key}`)}
                </button>
              ))}
            </div>
            <DateTimePicker
              id={`lead-${lead.id}-action-dialog-at`}
              label={t("actionDialog.dateLabel")}
              value={dueAt}
              onChange={(iso) => {
                setDueAt(iso);
                setPreset(iso ? "custom" : "none");
              }}
            />
          </div>

          <p className="flex gap-1.5 text-xs leading-relaxed text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("actionDialog.hint")}
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("detail.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || add.isPending}
              isLoading={add.isPending}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("actionDialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
