"use client";

import { useTranslations } from "next-intl";
import { StickyNote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import { MAX_NOTES_LENGTH } from "../../constants";

interface CustomerNotesCardProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  isSavingNotes: boolean;
}

/**
 * Notas del cliente en escritorio (antes solo existían en el teléfono). El
 * guardado es automático: lo hace CustomerDetail con debounce.
 */
export function CustomerNotesCard({
  notes,
  onNotesChange,
  isSavingNotes,
}: CustomerNotesCardProps) {
  const t = useTranslations("customers");

  return (
    <Card variant="glass">
      <DashboardCardHeader icon={StickyNote} title={t("detail.notes")}>
        {isSavingNotes && (
          <span className="text-xs text-slate-500">{t("detail.mobile.saving")}</span>
        )}
      </DashboardCardHeader>
      <CardContent className="space-y-2">
        <textarea
          rows={4}
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder={t("detail.notesPlaceholder")}
          aria-label={t("detail.notes")}
          className="w-full resize-y rounded-card border-0 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200"
        />
        <p className="text-xs text-slate-500">{t("detail.notesHint")}</p>
      </CardContent>
    </Card>
  );
}
