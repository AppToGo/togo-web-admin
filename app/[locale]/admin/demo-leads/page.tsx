"use client";

/**
 * Demo Leads Page
 * Super Admin page for viewing potential customers captured in demo mode
 */

import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Users } from "lucide-react";
import {
  useDemoLeads,
  useDeleteDemoLead,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DemoLeadsPage() {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isSuperAdmin = useIsSuperAdmin();

  const { data: leads, isLoading: isLeadsLoading } = useDemoLeads(isSuperAdmin);
  const deleteLead = useDeleteDemoLead();

  const handleDelete = (id: string) => {
    if (window.confirm(t("deleteConfirm"))) {
      deleteLead.mutate(id);
    }
  };

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
        <CardContent>
          {isLeadsLoading ? (
            <p className="text-sm text-slate-500">…</p>
          ) : !leads || leads.length === 0 ? (
            <p className="text-sm text-slate-500">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">{t("columns.name")}</th>
                    <th className="py-2 pr-4 font-medium">{t("columns.phone")}</th>
                    <th className="py-2 pr-4 font-medium">{t("columns.business")}</th>
                    <th className="py-2 pr-4 font-medium">{t("columns.lastDemo")}</th>
                    <th className="py-2 pr-4 font-medium">{t("columns.count")}</th>
                    <th className="py-2 font-medium">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {lead.name}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        +{lead.phone}
                      </td>
                      <td className="py-2 pr-4 text-slate-500">
                        {lead.businessName ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-500">
                        {formatDateTime(lead.lastDemoAt, locale)}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {lead.demoCount}
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lead.id)}
                          disabled={deleteLead.isPending}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
