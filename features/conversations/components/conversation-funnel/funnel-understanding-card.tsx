"use client";

import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ConversationFunnel } from "../../types";
import { FUNNEL_TILE, formatRate, ratio, useFunnelStateLabel } from "./funnel-format";

/** Colores de las series; los mismos tonos que los badges de resultado. */
const SERIES = {
  unknown: "#f59e0b",
  invalidSelection: "#6366f1",
  outOfStep: "#0ea5e9",
} as const;

interface FunnelUnderstandingCardProps {
  turns: ConversationFunnel["turns"];
}

/**
 * Qué tan bien entiende el bot: mensajes que no entendió, opciones
 * inválidas y mensajes fuera de paso, en total, por día y por paso.
 */
export function FunnelUnderstandingCard({
  turns,
}: FunnelUnderstandingCardProps) {
  const t = useTranslations("conversations.funnel.understanding");
  const stateLabel = useFunnelStateLabel();
  const { totals, rates } = turns;

  const tiles = [
    { key: "unknown", value: rates.unknown, count: totals.unknown },
    {
      key: "invalidSelection",
      value: rates.invalidSelection,
      count: totals.invalidSelection,
    },
    { key: "outOfStep", value: rates.outOfStep, count: totals.outOfStep },
    {
      key: "promptTextMatched",
      value: rates.promptTextMatched,
      count: totals.promptTextMatched,
    },
  ] as const;

  // Porcentaje de 0 a 100 por día, para el gráfico.
  const chartData = turns.byDay.map((day) => ({
    date: day.date.slice(5),
    unknown: percent(day.unknown, day.turns),
    invalidSelection: percent(day.invalidSelection, day.turns),
    outOfStep: percent(day.outOfStep, day.turns),
  }));

  return (
    <Card variant="glass">
      <DashboardCardHeader
        icon={Brain}
        title={t("title")}
        subtitle={t("subtitle", { turns: totals.turns })}
      />
      <CardContent className="space-y-6">
        {totals.turns === 0 ? (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiles.map((tile) => (
                <div
                  key={tile.key}
                  className={FUNNEL_TILE}
                >
                  <p className="text-sm text-slate-500">
                    {t(`tiles.${tile.key}.title`)}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatRate(tile.value)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t(`tiles.${tile.key}.description`, { count: tile.count })}
                  </p>
                </div>
              ))}
            </div>

            {chartData.length > 1 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      unit="%"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        fontSize: 13,
                      }}
                    />
                    <Legend
                      iconSize={10}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    {(Object.keys(SERIES) as Array<keyof typeof SERIES>).map(
                      (key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={t(`tiles.${key}.title`)}
                          stroke={SERIES[key]}
                          strokeWidth={2}
                          dot={false}
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="overflow-x-auto rounded-card bg-white/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.state")}</TableHead>
                    <TableHead className="text-right">
                      {t("table.turns")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("tiles.unknown.title")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("tiles.invalidSelection.title")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("tiles.outOfStep.title")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turns.byState.map((row) => (
                    <TableRow key={row.state}>
                      <TableCell className="font-medium text-slate-700">
                        {stateLabel(row.state)}
                      </TableCell>
                      <TableCell className="text-right">{row.turns}</TableCell>
                      <TableCell className="text-right">
                        {formatRate(ratio(row.unknown, row.turns))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRate(ratio(row.invalidSelection, row.turns))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRate(ratio(row.outOfStep, row.turns))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}
