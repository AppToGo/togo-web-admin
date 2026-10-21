"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type { DemoLead } from "@/types/auth.types";
import {
  PRIORITY_PILL_CLASS,
  formatPhone,
  formatRelative,
  isOverdue,
  safeLabel,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

/**
 * Tarjeta de un posible cliente en el tablero: toda la tarjeta abre la
 * ficha. La próxima acción se resalta (ámbar si ya venció).
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
  const business = [
    lead.establishmentName ?? lead.businessName,
    lead.businessType,
  ]
    .filter(Boolean)
    .join(" · ");
  const overdue = isOverdue(lead.nextActionAt);

  return (
    <button
      type="button"
      onClick={() => onOpen(lead.id)}
      className="group flex w-full flex-col gap-3 rounded-[20px] border border-white/90 bg-white/70 px-4 py-3.5 text-left shadow-card-sm transition-colors hover:border-indigo-200 hover:bg-white hover:shadow-card-md"
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={lead.name} seed={lead.id} size="md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold text-slate-900">
            {lead.name}
          </span>
          {business && (
            <span className="truncate text-[13px] text-slate-500">
              {business}
            </span>
          )}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            PRIORITY_PILL_CLASS[lead.priority]
          )}
        >
          {safeLabel(tt, `filters.priority.${lead.priority}`, lead.priority)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5">
          {t("card.orders", { count: lead.orderCount })}
        </span>
        <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5">
          {t("card.tries", { count: lead.demoCount })}
        </span>
        {lead.revoked && (
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-semibold text-red-700">
            {t("card.revoked")}
          </span>
        )}
      </div>

      {lead.nextAction && (
        <div
          className={cn(
            "flex gap-2 rounded-xl px-2.5 py-2 text-[13px]",
            overdue
              ? "bg-amber-100 text-amber-900"
              : "bg-indigo-50 text-indigo-900"
          )}
        >
          <CalendarClock
            className="mt-px h-[15px] w-[15px] shrink-0"
            aria-hidden
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="line-clamp-2">{lead.nextAction}</span>
            {lead.nextActionAt && (
              <span className="mt-0.5 text-xs font-semibold">
                {overdue
                  ? t("card.overdue")
                  : formatRelative(lead.nextActionAt, locale)}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2.5 text-xs text-slate-500">
        <span className="truncate tabular-nums">{formatPhone(lead.phone)}</span>
        <span className="shrink-0">
          {formatRelative(lead.lastDemoAt, locale)}
        </span>
      </div>
    </button>
  );
}
