"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversationFunnel } from "../../types";
import { formatRate } from "./funnel-format";

interface FunnelParaphraseCardProps {
  paraphrase: NonNullable<ConversationFunnel["paraphrase"]>;
}

/**
 * Reescrituras con IA (plan bot natural, T21): cuántos avisos salieron
 * reescritos, cuántos descartó el validador y por qué.
 */
export function FunnelParaphraseCard({
  paraphrase,
}: FunnelParaphraseCardProps) {
  const t = useTranslations("conversations.funnel.paraphrase");

  const tiles = [
    { key: "applied", value: paraphrase.applied },
    { key: "rejected", value: paraphrase.rejected },
    { key: "failed", value: paraphrase.failed },
  ] as const;

  const label = (group: "reasons" | "causes", key: string) =>
    t.has(`${group}.${key}`) ? t(`${group}.${key}`) : key;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-slate-500">
          {t("rate", {
            rate: formatRate(paraphrase.rates.applied),
            requested: paraphrase.requested,
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <div
              key={tile.key}
              className="rounded-lg border border-slate-200 p-4"
            >
              <p className="text-sm text-slate-500">{t(tile.key)}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {tile.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BreakdownList
            title={t("rejectedReasons")}
            rows={paraphrase.rejectedByReason.map((row) => ({
              key: row.reason,
              label: label("reasons", row.reason),
              count: row.count,
            }))}
          />
          <BreakdownList
            title={t("failedCauses")}
            rows={paraphrase.failedByCause.map((row) => ({
              key: row.cause,
              label: label("causes", row.cause),
              count: row.count,
            }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; label: string; count: number }>;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">{title}</p>
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between py-2 text-sm"
          >
            <dt className="text-slate-600">{row.label}</dt>
            <dd className="font-semibold text-slate-900">{row.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
