"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type {
  DemoFunnelChannelRow,
  DemoFunnelCounts,
  DemoFunnelGroup,
  DemoFunnelResponse,
  DemoFunnelStep,
} from "@/types/auth.types";
import { percentOf } from "@/features/admin/demo-leads/utils/funnel.utils";

const CARD = "rounded-[20px] border border-white/90 bg-white/70 p-4 lg:p-5";

interface LeadsFunnelViewProps {
  data: DemoFunnelResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function LeadsFunnelView({
  data,
  isLoading,
  isError,
  onRetry,
}: LeadsFunnelViewProps) {
  const t = useTranslations("admin-demo-leads");

  if (isLoading) return <FunnelSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md bg-amber-50 px-4 py-8 text-center">
        <p className="text-sm text-amber-700">{t("funnel.error")}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.totalLeads === 0 ? (
        <p className={`${CARD} py-10 text-center text-sm text-slate-500`}>
          {t("funnel.empty")}
        </p>
      ) : (
        <section className={CARD}>
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {t("funnel.totalLeads", { count: data.totalLeads })}
          </p>
          <StepBars counts={data.counts} order={data.stepOrder} />
        </section>
      )}

      <section className={CARD}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          {t("funnel.tables.byChannel")}
        </h2>
        <BreakdownTable
          firstColumn={t("funnel.tables.channel")}
          order={data.stepOrder}
          rows={data.byChannel.map((row: DemoFunnelChannelRow) => ({
            key: row.channel ?? "NONE",
            label: t(`funnel.channels.${row.channel ?? "NONE"}`),
            group: row,
          }))}
        />
      </section>

      <section className={CARD}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          {t("funnel.tables.byAd")}
        </h2>
        {data.byAd.length === 0 ? (
          <p className="text-sm text-slate-500">{t("funnel.tables.noAds")}</p>
        ) : (
          <BreakdownTable
            firstColumn={t("funnel.tables.name")}
            order={data.stepOrder}
            rows={data.byAd.map((row) => ({
              key: row.adKey,
              label: row.adHeadline ?? t("funnel.filters.noHeadline"),
              group: row,
            }))}
          />
        )}
      </section>

      <p className="text-xs text-slate-500">{t("funnel.note")}</p>
    </div>
  );
}

/** Barras horizontales: una serie, un solo tono (magnitud) y valores en texto. */
function StepBars({
  counts,
  order,
}: {
  counts: DemoFunnelCounts;
  order: DemoFunnelStep[];
}) {
  const t = useTranslations("admin-demo-leads");
  const started = counts.STARTED;
  return (
    <ol className="space-y-3">
      {order.map((step, index) => {
        const count = counts[step] ?? 0;
        const ofStarted = percentOf(count, started);
        const prev = index > 0 ? counts[order[index - 1]] ?? 0 : null;
        const ofPrev = prev === null ? null : percentOf(count, prev);
        const width = started > 0 ? Math.min(100, (count / started) * 100) : 0;
        return (
          <li key={step}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[13px] font-medium text-slate-800">
                {t(`funnel.steps.${step}`)}
              </span>
              <span className="text-[13px] tabular-nums text-slate-900">
                <span className="font-bold">{count}</span>
                {ofStarted !== null && (
                  <span className="text-slate-500">
                    {" · "}
                    {t("funnel.ofStarted", { pct: ofStarted })}
                  </span>
                )}
                {ofPrev !== null && (
                  <span className="text-slate-500">
                    {" · "}
                    {t("funnel.ofPrevious", { pct: ofPrev })}
                  </span>
                )}
              </span>
            </div>
            <div
              className="mt-1 h-2.5 w-full rounded-full bg-slate-100"
              role="img"
              aria-label={`${t(`funnel.steps.${step}`)}: ${count}`}
            >
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BreakdownTable({
  firstColumn,
  order,
  rows,
}: {
  firstColumn: string;
  order: DemoFunnelStep[];
  rows: { key: string; label: string; group: DemoFunnelGroup }[];
}) {
  const t = useTranslations("admin-demo-leads");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
            <th className="py-2 pr-4">{firstColumn}</th>
            <th className="px-2 py-2 text-right">{t("funnel.tables.leads")}</th>
            {order.map((step) => (
              <th key={step} className="px-2 py-2 text-right">
                {t(`funnel.steps.${step}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, group }) => (
            <tr key={key} className="border-b border-slate-100 last:border-0">
              <td className="max-w-[16rem] truncate py-2 pr-4 font-medium text-slate-800">
                {label}
              </td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-900">
                {group.totalLeads}
              </td>
              {order.map((step) => (
                <td
                  key={step}
                  className="px-2 py-2 text-right tabular-nums text-slate-700"
                >
                  {group.counts[step] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className={`${CARD} space-y-4`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-[20px]" />
    </div>
  );
}
