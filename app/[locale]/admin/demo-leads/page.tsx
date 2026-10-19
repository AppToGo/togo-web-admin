"use client";

/**
 * Demo Leads Page — Mini CRM de adquisición
 * Tablero kanban por etapa comercial con filtros, conteos reales
 * y panel de detalle (ficha, sugerencia, línea de tiempo, notas).
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import type { DemoLeadStage } from "@/types/auth.types";
import {
  useDemoLeads,
  useDemoLeadsPipeline,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";
import { LeadDetailPanel } from "@/features/admin/demo-leads/components/LeadDetailPanel";

const STAGES: DemoLeadStage[] = [
  "NEW",
  "ACTIVE_DEMO",
  "FOLLOW_UP",
  "CONTACTED",
  "NEGOTIATION",
  "CUSTOMER",
  "LOST",
];

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPhone(phone: string): string {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

function priorityVariant(
  priority: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "HIGH") return "destructive";
  if (priority === "LOW") return "outline";
  return "secondary";
}

function safeLabel(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  try {
    return t(key);
  } catch {
    return fallback;
  }
}

export default function DemoLeadsPage() {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isSuperAdmin = useIsSuperAdmin();

  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: leads,
    isLoading: isLeadsLoading,
    isError: isLeadsError,
    refetch,
  } = useDemoLeads(
    {
      q: search.trim() || undefined,
      priority: priority || undefined,
      overdueOnly: overdueOnly || undefined,
      includeRevoked: includeRevoked || undefined,
    },
    isSuperAdmin,
  );
  const { data: pipeline } = useDemoLeadsPipeline(isSuperAdmin);

  const counts = React.useMemo(() => {
    const map = new Map<DemoLeadStage, number>();
    for (const entry of pipeline ?? []) map.set(entry.stage, entry.count);
    return map;
  }, [pipeline]);

  if (isAuthLoading) return null;

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder={t("filters.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={120}
              className="max-w-xs"
            />
            <Select
              value={priority || "ALL"}
              onValueChange={(v) => setPriority(v === "ALL" ? "" : v)}
            >
              <SelectTrigger className="max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filters.allPriorities")}</SelectItem>
                <SelectItem value="HIGH">{t("filters.priority.HIGH")}</SelectItem>
                <SelectItem value="NORMAL">{t("filters.priority.NORMAL")}</SelectItem>
                <SelectItem value="LOW">{t("filters.priority.LOW")}</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
              />
              {t("filters.overdueOnly")}
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={includeRevoked}
                onChange={(e) => setIncludeRevoked(e.target.checked)}
              />
              {t("filters.includeRevoked")}
            </label>
          </div>

          {isLeadsLoading ? (
            <p className="text-sm text-slate-500">…</p>
          ) : isLeadsError ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600">{t("loadError")}</p>
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
            <p className="text-sm text-slate-500">{t("empty")}</p>
          ) : (
            <div className="grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-2">
              {STAGES.map((stage) => {
                const column = leads.filter((lead) => lead.stage === stage);
                return (
                  <div
                    key={stage}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-2 space-y-2"
                  >
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        {t(`stages.${stage}`)}
                      </h2>
                      <Badge variant="secondary">{counts.get(stage) ?? 0}</Badge>
                    </div>
                    {column.map((lead) => {
                      const isOverdue =
                        !!lead.nextActionAt &&
                        new Date(lead.nextActionAt).getTime() < Date.now();
                      return (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => setSelectedId(lead.id)}
                          className="w-full text-left rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {lead.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatPhone(lead.phone)}
                          </p>
                          {(lead.establishmentName ?? lead.businessName) && (
                            <p className="text-xs text-slate-500 truncate">
                              {lead.establishmentName ?? lead.businessName}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant={priorityVariant(lead.priority)}>
                              {safeLabel(
                                t as (key: string) => string,
                                `filters.priority.${lead.priority}`,
                                lead.priority,
                              )}
                            </Badge>
                            {lead.orderCount > 0 && (
                              <Badge variant="outline">
                                {t("card.orders", { count: lead.orderCount })}
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge variant="destructive">
                                {t("card.overdue")}
                              </Badge>
                            )}
                            {lead.revoked && (
                              <Badge variant="destructive">
                                {t("card.revoked")}
                              </Badge>
                            )}
                          </div>
                          {lead.nextAction && (
                            <p className="text-xs text-slate-600 mt-2 truncate">
                              {t("card.nextAction", { action: lead.nextAction })}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-1">
                            {formatDateTime(lead.lastDemoAt, locale)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDetailPanel
        leadId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </DashboardLayout>
  );
}
