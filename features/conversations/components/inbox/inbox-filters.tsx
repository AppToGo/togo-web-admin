"use client";

import { useTranslations } from "next-intl";
import { Check, Clock, Filter, Inbox, User, UserX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangeFilter } from "@/features/filters/components";
import { DEFAULT_INBOX_FILTERS } from "../../utils/inbox-filters";
import type { ConversationSummary, InboxFiltersValue, InboxView } from "../../types";

interface InboxFiltersProps {
  value: InboxFiltersValue;
  onChange: (value: InboxFiltersValue) => void;
  summary: ConversationSummary | undefined;
}

const VIEW_OPTIONS: Array<{
  id: InboxView;
  icon: LucideIcon;
  iconClass: string;
  count?: (summary: ConversationSummary) => number;
}> = [
  { id: "all", icon: Inbox, iconClass: "bg-indigo-100 text-indigo-600" },
  {
    id: "waiting",
    icon: Clock,
    iconClass: "bg-amber-100 text-amber-600",
    count: (s) => s.pendingHuman,
  },
  {
    id: "mine",
    icon: User,
    iconClass: "bg-blue-100 text-blue-600",
    count: (s) => s.mine,
  },
  {
    id: "unassigned",
    icon: UserX,
    iconClass: "bg-slate-100 text-slate-600",
    count: (s) => s.unassigned,
  },
];

/**
 * Botón de filtros del inbox (al lado del buscador). Mismo patrón visual
 * que el popover de filtros de Pedidos: período de fechas arriba y, debajo,
 * la vista de conversaciones (selección única, reemplaza a las pestañas).
 */
export function InboxFilters({ value, onChange, summary }: InboxFiltersProps) {
  const t = useTranslations("inbox");
  const tc = useTranslations("common");

  const hasViewFilter = value.view !== DEFAULT_INBOX_FILTERS.view;
  const hasDateFilter = value.date !== null;
  const activeFiltersCount = [hasViewFilter, hasDateFilter].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={tc("buttons.filter")}
          title={tc("buttons.filter")}
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-card transition-colors",
            activeFiltersCount > 0
              ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
              : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{t("filters.title")}</h3>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_INBOX_FILTERS)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {tc("buttons.clearAll")}
            </button>
          )}
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-4">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("filters.dateRange")}
            </h4>
            <DateRangeFilter
              variant="compact"
              showPresets={true}
              availablePresets={["today", "yesterday", "week", "last7days", "month", "custom"]}
              allDatesLabel={t("filters.allDates")}
              value={value.date}
              onChange={(date) => onChange({ ...value, date })}
            />
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("filters.view")}
            </h4>
            <div role="radiogroup" className="space-y-1">
              {VIEW_OPTIONS.map(({ id, icon: Icon, iconClass, count }) => {
                const isActive = value.view === id;
                const badge = summary && count ? count(summary) : 0;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => onChange({ ...value, view: id })}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-lg px-1.5 py-1 transition-colors",
                      isActive ? "bg-indigo-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          isActive
                            ? "font-medium text-indigo-700"
                            : "text-slate-700 group-hover:text-slate-900"
                        )}
                      >
                        {t(`tabs.${id}`)}
                      </span>
                      {badge > 0 && (
                        <span className="rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
                          {badge}
                        </span>
                      )}
                    </div>
                    {isActive && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
