"use client";

/**
 * Embudo del bot comercial del demo: cuántos leads llegan a cada paso de la
 * conversación. Solo con permiso platform.leads.view_all (la API lo exige).
 */

import { useTranslations } from "next-intl";
import { ArrowLeft, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link } from "@/i18n/routing";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { usePlatformPermission } from "@/features/auth/hooks/usePlatformPermission";
import { useUrlParamState } from "@/hooks/useUrlParamState";
import { useDemoLeadsFunnel } from "@/features/admin/demo-leads/hooks/useDemoLeads";
import { LeadsFunnelFilters } from "@/features/admin/demo-leads/components/LeadsFunnelFilters";
import { LeadsFunnelView } from "@/features/admin/demo-leads/components/LeadsFunnelView";
import { FUNNEL_CHANNELS } from "@/features/admin/demo-leads/utils/funnel.utils";
import type { DemoFunnelChannel } from "@/types/auth.types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function DemoLeadsFunnelPage() {
  const t = useTranslations("admin-demo-leads");
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { allowed, isLoading: isPermissionLoading } = usePlatformPermission(
    "platform.leads.view_all"
  );

  const [fromRaw, setFrom, clearFrom] = useUrlParamState("from");
  const [toRaw, setTo, clearTo] = useUrlParamState("to");
  const [channelRaw, setChannel, clearChannel] = useUrlParamState("channel");
  const [adRaw, setAd, clearAd] = useUrlParamState("ad");

  // Valores de la URL validados: un parámetro editado a mano no rompe la query.
  const from = fromRaw && DATE_PATTERN.test(fromRaw) ? fromRaw : null;
  const to = toRaw && DATE_PATTERN.test(toRaw) ? toRaw : null;
  const channel = FUNNEL_CHANNELS.find((c) => c === channelRaw) ?? null;
  const adKey = adRaw && /^[a-f0-9]{1,32}$/.test(adRaw) ? adRaw : null;

  const { data, isLoading, isError, refetch } = useDemoLeadsFunnel(
    {
      from: from ?? undefined,
      to: to ?? undefined,
      channel: channel ?? undefined,
      adKey: adKey ?? undefined,
    },
    allowed
  );

  if (isAuthLoading || isPermissionLoading) return null;

  if (!allowed) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  const replace = (
    value: string | null,
    set: typeof setFrom,
    clear: typeof clearFrom
  ) => (value ? set(value, { push: false }) : clear());

  const handleChannel = (next: DemoFunnelChannel | null) => {
    replace(next, setChannel, clearChannel);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        <div>
          <Link
            href="/admin/demo-leads"
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("funnel.back")}
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 lg:text-2xl">
            <Filter className="h-6 w-6 text-indigo-600" aria-hidden />
            {t("funnel.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("funnel.subtitle")}</p>
        </div>

        <LeadsFunnelFilters
          from={from}
          to={to}
          channel={channel}
          adKey={adKey}
          ads={data?.byAd ?? []}
          onRangeChange={(nextFrom, nextTo) => {
            replace(nextFrom, setFrom, clearFrom);
            replace(nextTo, setTo, clearTo);
          }}
          onChannelChange={handleChannel}
          onAdChange={(next) => replace(next, setAd, clearAd)}
        />

        <LeadsFunnelView
          data={data}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
        />
      </div>
    </DashboardLayout>
  );
}
