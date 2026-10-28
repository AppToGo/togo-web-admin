"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  Ban,
  CalendarClock,
  LogIn,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type { DemoLead } from "@/types/auth.types";
import {
  OUTCOME_PILL_CLASS,
  PRIORITY_PILL_CLASS,
  formatRelative,
  isInDemo,
  isOverdue,
  safeLabel,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";
import { LeadOwnerAvatar } from "./LeadOwnerAvatar";
import { LeadActionDialog } from "./LeadActionDialog";

/**
 * Tarjeta de un posible cliente en el tablero, en 3 bandas: quién es, qué
 * sigue (la próxima acción en una sola línea, con "+" para agregar otra) y
 * contexto (actividad en la demo y responsable). Toda la tarjeta abre la
 * ficha; los botones internos no.
 */
export function LeadCard({
  lead,
  onOpen,
}: {
  lead: DemoLead;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const tt = t as (key: string) => string;
  const [isActionOpen, setIsActionOpen] = useState(false);
  const business = [
    lead.establishmentName ?? lead.businessName,
    lead.businessType,
  ]
    .filter(Boolean)
    .join(" · ");
  const closed = lead.stage === "CLOSED";
  const overdue = isOverdue(lead.nextActionAt);
  // Normal es lo habitual: solo se marcan Alta y Baja.
  const showPriority = !closed && lead.priority !== "NORMAL";

  const openAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionOpen(true);
  };

  return (
    // div y no button: adentro van botones (responsable, próxima acción)
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lead.id)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(lead.id);
        }
      }}
      className="group flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-white/90 bg-white/80 p-3.5 text-left shadow-card-sm transition-colors hover:border-indigo-200 hover:bg-white hover:shadow-card-md"
    >
      {/* 1 · Quién */}
      <div className="flex items-start gap-2.5">
        <InitialsAvatar name={lead.name} seed={lead.id} size="xs" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "line-clamp-2 text-sm font-semibold leading-snug",
              lead.name ? "text-slate-900" : "text-slate-500"
            )}
          >
            {lead.name || t("card.noName")}
          </span>
          {business && (
            <span className="truncate text-[12.5px] text-slate-500">
              {business}
            </span>
          )}
        </span>
        {closed && lead.outcome ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
              OUTCOME_PILL_CLASS[lead.outcome]
            )}
          >
            {t(`outcomes.${lead.outcome}`)}
          </span>
        ) : (
          showPriority && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
                PRIORITY_PILL_CLASS[lead.priority]
              )}
            >
              {safeLabel(tt, `filters.priority.${lead.priority}`, lead.priority)}
            </span>
          )
        )}
      </div>

      {/* 2 · Qué sigue: siempre una línea */}
      {lead.revoked ? (
        <span className="flex h-[34px] items-center gap-2 rounded-[10px] bg-red-50 px-2.5 text-[13px] font-medium text-red-700">
          <Ban className="h-[15px] w-[15px] shrink-0" aria-hidden />
          <span className="truncate">{t("card.noContact")}</span>
        </span>
      ) : lead.nextAction ? (
        <span
          className={cn(
            "flex h-[34px] items-center gap-2 rounded-[10px] pl-2.5 pr-1 text-[13px]",
            overdue ? "bg-amber-100 text-amber-900" : "bg-slate-100/80 text-slate-700"
          )}
        >
          {overdue ? (
            <AlertCircle className="h-[15px] w-[15px] shrink-0" aria-hidden />
          ) : (
            <CalendarClock
              className="h-[15px] w-[15px] shrink-0 text-indigo-600"
              aria-hidden
            />
          )}
          <span className="min-w-0 flex-1 truncate" title={lead.nextAction}>
            {lead.nextAction}
          </span>
          {lead.nextActionAt && (
            <span
              className={cn(
                "shrink-0 text-xs font-semibold",
                overdue ? "text-amber-900" : "text-indigo-700"
              )}
            >
              {overdue
                ? t("card.overdue")
                : formatRelative(lead.nextActionAt, locale)}
            </span>
          )}
          <button
            type="button"
            onClick={openAction}
            aria-label={t("actionDialog.title")}
            title={t("actionDialog.title")}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              overdue
                ? "bg-white/60 text-amber-900 hover:bg-white"
                : "bg-white text-indigo-700 hover:bg-indigo-50"
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </span>
      ) : (
        !closed && (
          <button
            type="button"
            onClick={openAction}
            className="flex h-[34px] items-center gap-2 rounded-[10px] border border-dashed border-indigo-300 px-2.5 text-left text-[13px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50/60"
          >
            <Plus className="h-[15px] w-[15px] shrink-0" aria-hidden />
            {t("card.addAction")}
          </button>
        )
      )}

      {/* 3 · Contexto */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span
          title={t("detail.summaryOrders")}
          className="inline-flex items-center gap-1 tabular-nums"
        >
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
          {lead.orderCount}
        </span>
        <span
          title={t("detail.summaryTries")}
          className="inline-flex items-center gap-1 tabular-nums"
        >
          <LogIn className="h-3.5 w-3.5" aria-hidden />
          {lead.demoCount}
        </span>
        {!closed && isInDemo(lead) && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            {t("card.inDemo")}
          </span>
        )}
        <span className="ml-auto shrink-0">
          {formatRelative(lead.lastDemoAt, locale)}
        </span>
        <LeadOwnerAvatar lead={lead} />
      </div>

      {isActionOpen && (
        // Los eventos de React cruzan el portal del modal: sin esto, un clic
        // adentro llegaría a la tarjeta y abriría la ficha.
        <span
          className="contents"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <LeadActionDialog
            lead={lead}
            isOpen
            onClose={() => setIsActionOpen(false)}
          />
        </span>
      )}
    </div>
  );
}
