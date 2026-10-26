"use client";

/**
 * Demo Leads Page — Mini CRM de adquisición
 * Tablero por etapa comercial con el estilo del panel (vidrio sobre el
 * degradado): métricas, filtros en pastillas, columnas colapsables como
 * en Pedidos y panel de detalle. En el teléfono, una etapa a la vez.
 */

import * as React from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { PillGroup } from "@/components/ui/pill-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Compass,
  Handshake,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { DemoLeadPriority, DemoLeadStage } from "@/types/auth.types";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useDemoLeads,
  useDemoLeadsPipeline,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";
import { LeadDetailPanel } from "@/features/admin/demo-leads/components/LeadDetailPanel";
import { CreateLeadDrawer } from "@/features/admin/demo-leads/components/CreateLeadDrawer";
import { ScoutLeadsDrawer } from "@/features/admin/demo-leads/components/ScoutLeadsDrawer";
import { LeadCard } from "@/features/admin/demo-leads/components/LeadCard";
import { LeadsBoardColumn } from "@/features/admin/demo-leads/components/LeadsBoardColumn";
import {
  DEMO_LEAD_PRIORITIES,
  DEMO_LEAD_STAGES,
  STAGE_DOT_CLASS,
  isOverdue,
  readCollapsedStages,
  saveCollapsedStages,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

type PriorityFilter = DemoLeadPriority | "ALL";

export default function DemoLeadsPage() {
  const t = useTranslations("admin-demo-leads");
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isSuperAdmin = useIsSuperAdmin();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [priority, setPriority] = useState<PriorityFilter>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScoutOpen, setIsScoutOpen] = useState(false);
  // Teléfono: el tablero no cabe, se ve una etapa a la vez.
  const [mobileStage, setMobileStage] = useState<DemoLeadStage>("NEW");

  // Columnas colapsadas a un riel: preferencia por navegador, como Pedidos.
  const [collapsedStages, setCollapsedStages] = useState(readCollapsedStages);
  const handleCollapsedChange = useCallback(
    (stage: DemoLeadStage, collapsed: boolean) => {
      setCollapsedStages((prev) => {
        const next = { ...prev, [stage]: collapsed };
        saveCollapsedStages(next);
        return next;
      });
    },
    []
  );

  const {
    data: leads,
    isLoading: isLeadsLoading,
    isError: isLeadsError,
    refetch,
  } = useDemoLeads(
    {
      q: debouncedSearch.trim() || undefined,
      priority: priority === "ALL" ? undefined : priority,
      overdueOnly: overdueOnly || undefined,
      includeRevoked: includeRevoked || undefined,
    },
    isSuperAdmin
  );
  const { data: pipeline } = useDemoLeadsPipeline(isSuperAdmin);

  const counts = React.useMemo(() => {
    const map = new Map<DemoLeadStage, number>();
    for (const entry of pipeline ?? []) map.set(entry.stage, entry.count);
    return map;
  }, [pipeline]);

  const byStage = React.useMemo(() => {
    const map = new Map<DemoLeadStage, NonNullable<typeof leads>>();
    for (const stage of DEMO_LEAD_STAGES) map.set(stage, []);
    for (const lead of leads ?? []) map.get(lead.stage)?.push(lead);
    return map;
  }, [leads]);

  const overdueCount = React.useMemo(
    () => (leads ?? []).filter((lead) => isOverdue(lead.nextActionAt)).length,
    [leads]
  );

  if (isAuthLoading) return null;

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  const kpis = [
    {
      label: t("kpis.onBoard"),
      value: leads?.length ?? 0,
      icon: UserPlus,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: t("kpis.overdue"),
      value: overdueCount,
      icon: Clock,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: t("kpis.negotiation"),
      value: counts.get("NEGOTIATION") ?? 0,
      icon: Handshake,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: t("kpis.customers"),
      value: counts.get("CUSTOMER") ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];

  const togglePill = (on: boolean) =>
    cn(
      "flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
      on
        ? "border-indigo-600 bg-indigo-600 text-white"
        : "border-white/90 bg-white/75 text-slate-600 hover:bg-white hover:text-slate-900"
    );

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        {/* Encabezado + búsqueda */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* < lg el nombre de la sección ya está en la barra superior. */}
          <div className="hidden lg:block">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <UserPlus className="h-6 w-6 text-indigo-600" aria-hidden />
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-white/90 bg-white/75 px-4 shadow-glass lg:w-80 lg:flex-none">
              <Search
                className="h-[18px] w-[18px] shrink-0 text-slate-500"
                aria-hidden
              />
              <span className="sr-only">{t("filters.search")}</span>
              <input
                type="search"
                placeholder={t("filters.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={120}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScoutOpen(true)}
              className="h-11 shrink-0 rounded-full border-indigo-200 bg-white/85 px-4 text-indigo-700 hover:bg-indigo-50"
              aria-label={t("scout.button")}
            >
              <Compass className="h-[18px] w-[18px]" aria-hidden />
              <span className="hidden sm:inline">{t("scout.button")}</span>
            </Button>
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="h-11 shrink-0 rounded-full px-4"
              aria-label={t("create.title")}
            >
              <Plus className="h-[18px] w-[18px]" aria-hidden />
              <span className="hidden sm:inline">{t("create.button")}</span>
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, tone }, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3.5 rounded-[20px] border border-white/90 bg-white/65 px-4 py-3.5 md:rounded-3xl md:px-5",
                index > 1 && "hidden lg:flex"
              )}
            >
              <span
                className={cn(
                  "hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:flex",
                  tone
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="truncate text-xs text-slate-500 md:text-[13px]">
                  {label}
                </dt>
                <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 md:text-2xl">
                  {isLeadsLoading ? "–" : value}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        {/* Filtros */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <PillGroup
            label={t("filters.priorityLabel")}
            value={priority}
            onChange={setPriority}
            options={[
              {
                id: "ALL" as PriorityFilter,
                label: t("filters.allPriorities"),
              },
              ...DEMO_LEAD_PRIORITIES.map((p) => ({
                id: p as PriorityFilter,
                label: t(`filters.priority.${p}`),
              })),
            ]}
            appearance="glass"
            className="shrink-0 overflow-visible"
          />
          <button
            type="button"
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly((v) => !v)}
            className={togglePill(overdueOnly)}
          >
            <Clock className="h-4 w-4" aria-hidden />
            {t("filters.overdueOnly")}
            {overdueCount > 0 && !overdueOnly && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-bold tabular-nums text-amber-900">
                {overdueCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-pressed={includeRevoked}
            onClick={() => setIncludeRevoked((v) => !v)}
            className={togglePill(includeRevoked)}
          >
            {t("filters.includeRevoked")}
          </button>
          {!isLeadsLoading && leads && (
            <span className="ml-auto hidden text-sm text-slate-500 sm:inline">
              {t("count", { count: leads.length })}
            </span>
          )}
        </div>

        {/* Tablero */}
        {isLeadsLoading ? (
          <div className="flex gap-3.5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-96 w-[288px] shrink-0 rounded-3xl bg-white/60"
              />
            ))}
          </div>
        ) : isLeadsError ? (
          <div className="flex items-center gap-3 rounded-3xl border border-white/90 bg-white/65 p-5">
            <p className="text-sm text-red-700">{t("loadError")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : !leads || leads.length === 0 ? (
          <div className="rounded-3xl border border-white/90 bg-white/65 p-8 text-center">
            <UserPlus
              className="mx-auto mb-3 h-8 w-8 text-indigo-400"
              aria-hidden
            />
            <p className="text-sm text-slate-600">{t("empty")}</p>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            <PillGroup
              label={t("detail.stage")}
              variant="tabs"
              value={mobileStage}
              onChange={setMobileStage}
              options={DEMO_LEAD_STAGES.map((stage) => ({
                id: stage,
                label: t(`stages.${stage}`),
                count: byStage.get(stage)?.length ?? 0,
                dotClassName: STAGE_DOT_CLASS[stage],
              }))}
              className="-mx-4 px-4"
            />
            {(byStage.get(mobileStage) ?? []).length === 0 ? (
              <p className="rounded-[20px] bg-white/65 p-5 text-center text-sm text-slate-500">
                {t("emptyStage")}
              </p>
            ) : (
              (byStage.get(mobileStage) ?? []).map((lead) => (
                <LeadCard key={lead.id} lead={lead} onOpen={setSelectedId} />
              ))
            )}
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            <div className="flex items-start gap-3.5">
              {DEMO_LEAD_STAGES.map((stage) => (
                <LeadsBoardColumn
                  key={stage}
                  stage={stage}
                  leads={byStage.get(stage) ?? []}
                  count={byStage.get(stage)?.length ?? 0}
                  collapsed={!!collapsedStages[stage]}
                  onCollapsedChange={(collapsed) =>
                    handleCollapsedChange(stage, collapsed)
                  }
                  onOpenLead={setSelectedId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateLeadDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onOpenLead={setSelectedId}
      />

      <ScoutLeadsDrawer
        open={isScoutOpen}
        onClose={() => setIsScoutOpen(false)}
        onOpenLead={setSelectedId}
      />

      <LeadDetailPanel
        leadId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </DashboardLayout>
  );
}
