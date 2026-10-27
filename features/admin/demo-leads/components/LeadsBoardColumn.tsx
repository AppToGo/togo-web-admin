"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/pill-group";
import { HoverTooltip } from "@/features/orders/components/HoverTooltip";
import type {
  DemoLead,
  DemoLeadOutcome,
  DemoLeadStage,
} from "@/types/auth.types";
import { STAGE_DOT_CLASS } from "@/features/admin/demo-leads/utils/demo-leads.utils";
import { LeadCard } from "./LeadCard";

/** Ancho del riel de una columna colapsada (igual que en Pedidos). */
const RAIL_WIDTH = 56;

type OutcomeFilter = "ALL" | DemoLeadOutcome;
const OUTCOME_FILTERS: readonly OutcomeFilter[] = ["ALL", "WON", "LOST"];

/**
 * Columna del tablero de posibles clientes. Como en Pedidos, se puede
 * colapsar a un riel angosto (punto, conteo y nombre vertical) para dejar
 * a la vista solo las etapas que interesan en el momento.
 */
export function LeadsBoardColumn({
  stage,
  leads,
  count,
  collapsed,
  onCollapsedChange,
  onOpenLead,
}: {
  stage: DemoLeadStage;
  leads: DemoLead[];
  count: number;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onOpenLead: (id: string) => void;
}) {
  const t = useTranslations("admin-demo-leads");
  const name = t(`stages.${stage}`);
  // Cerrados: ganados y perdidos comparten columna, con filtro local.
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("ALL");
  const visibleLeads =
    stage === "CLOSED" && outcomeFilter !== "ALL"
      ? leads.filter((lead) => lead.outcome === outcomeFilter)
      : leads;

  if (collapsed) {
    return (
      <HoverTooltip content={t("actions.expandColumn")} side="right">
        <button
          type="button"
          aria-label={`${t("actions.expandColumn")}: ${name}`}
          onClick={() => onCollapsedChange(false)}
          className="flex h-[calc(100vh-340px)] min-h-[360px] shrink-0 flex-col items-center gap-3 rounded-3xl border border-white/60 bg-white/50 py-4 transition-colors hover:bg-white/80"
          style={{ flex: `0 0 ${RAIL_WIDTH}px` }}
        >
          <span
            aria-hidden
            className={cn("h-2.5 w-2.5 rounded-full", STAGE_DOT_CLASS[stage])}
          />
          <span className="text-[13px] font-bold tabular-nums text-slate-700">
            {count}
          </span>
          <span
            className="text-xs font-semibold text-slate-600"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {name}
          </span>
        </button>
      </HoverTooltip>
    );
  }

  return (
    <section
      aria-label={name}
      className="flex w-[288px] shrink-0 flex-col gap-2.5 rounded-3xl border border-white/75 bg-white/40 p-3"
    >
      <header className="flex items-center gap-2 py-0.5 pl-1.5">
        <span
          aria-hidden
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            STAGE_DOT_CLASS[stage]
          )}
        />
        <h2 className="truncate text-sm font-semibold text-slate-700">
          {name}
        </h2>
        <span className="ml-auto flex h-6 min-w-[26px] items-center justify-center rounded-full bg-white/85 px-2 text-xs font-bold tabular-nums text-slate-600">
          {count}
        </span>
        <HoverTooltip content={t("actions.collapseColumn")}>
          <button
            type="button"
            aria-label={`${t("actions.collapseColumn")}: ${name}`}
            onClick={() => onCollapsedChange(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800"
          >
            <Minimize2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </HoverTooltip>
      </header>
      {stage === "CLOSED" && leads.length > 0 && (
        <SegmentedControl
          label={t("outcomeFilter.label")}
          value={outcomeFilter}
          onChange={setOutcomeFilter}
          options={OUTCOME_FILTERS.map((id) => ({
            id,
            label: t(`outcomeFilter.${id}`),
          }))}
        />
      )}
      {visibleLeads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />
      ))}
    </section>
  );
}
