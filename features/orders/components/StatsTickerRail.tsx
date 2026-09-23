"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverTooltip } from "./HoverTooltip";
import type { Order, OrderStatus } from "../types";
import type { OrderMetricsResponse } from "../types/order-metrics.types";
import { formatCurrency } from "../utils/order-status.utils";
import { getLatenessLevel, getOldestElapsedMinutes } from "../utils/order-lateness.utils";

// Ticker CSS lives next to the component (React 19 hoists <style> to <head>
// and dedupes it by `href`). It is kept out of globals.css on purpose:
// Tailwind drops @keyframes that no processed rule references, which left
// the rail without animation.
const TICKER_CSS = `
@keyframes orders-ticker-y { from { transform: translateY(-50%); } to { transform: translateY(0); } }
.orders-ticker-track { animation: orders-ticker-y 22s linear infinite; }
.group:hover .orders-ticker-track { animation-play-state: paused; }
`;

const LATENESS_TEXT_CLASS = {
  ok: "text-slate-400",
  warning: "text-amber-400",
  critical: "text-red-400",
} as const;

interface TickerItem {
  label: string;
  value: string | number;
  /** Tailwind text color class for the value. */
  colorClass: string;
  trend?: "up" | "down";
}

// One ticker "lap". It is rendered twice in a row so the loop (translateY
// up to -50%) is seamless.
function TickerCopy({ items }: { items: TickerItem[] }) {
  return (
    <div className="inline-flex items-center gap-[22px] pe-[22px]">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {item.label}
          </span>
          <span className={cn("text-[13px] font-bold tabular-nums", item.colorClass)}>
            {item.value}
          </span>
          {item.trend && (
            <span
              className={cn(
                "text-[9px]",
                item.trend === "down" ? "text-amber-400" : "text-emerald-400"
              )}
            >
              {item.trend === "down" ? "▼" : "▲"}
            </span>
          )}
          <span className="text-slate-600 text-[10px]">•</span>
        </span>
      ))}
    </div>
  );
}

interface StatsTickerRailProps {
  metrics?: OrderMetricsResponse;
  activeOrders: Order[];
  onExpand: () => void;
}

/**
 * Collapsed "Operación en curso" rail: an infinite vertical ticker matching
 * the design (vertical text, same colors, pauses on hover). The whole rail
 * is a single expand button, like a collapsed board column.
 */
export function StatsTickerRail({ metrics, activeOrders, onExpand }: StatsTickerRailProps) {
  const t = useTranslations("orders");
  if (!metrics) return null;

  const countByStatus = (status: OrderStatus) => metrics.porEstadoOrden[status] || 0;
  const oldestMinutes = getOldestElapsedMinutes(activeOrders) ?? 0;
  const hasPending = metrics.conteos.pendientesPago > 0;

  const items: TickerItem[] = [
    { label: t("metrics.active"), value: activeOrders.length, colorClass: "text-indigo-300" },
    {
      label: t("status.CONFIRMED"),
      value: countByStatus("CONFIRMED"),
      colorClass: "text-blue-500",
      trend: "up",
    },
    { label: t("status.IN_PROGRESS"), value: countByStatus("IN_PROGRESS"), colorClass: "text-purple-500" },
    { label: t("status.READY"), value: countByStatus("READY"), colorClass: "text-amber-500" },
    {
      label: t("status.COMPLETED"),
      value: `${metrics.conteos.completadasHoy}/${metrics.conteos.hoy}`,
      colorClass: "text-emerald-500",
      trend: "up",
    },
    {
      label: t("metrics.paid"),
      value: formatCurrency(metrics.recaudos.pagadas.total),
      colorClass: "text-emerald-400",
      trend: "up",
    },
    {
      label: t("metrics.pendingPayment"),
      value: formatCurrency(metrics.recaudos.pendientesPago.total),
      colorClass: hasPending ? "text-amber-400" : "text-slate-400",
      trend: hasPending ? "down" : undefined,
    },
    {
      label: t("metrics.oldest"),
      value: t("elapsedMinutes", { count: oldestMinutes }),
      colorClass: LATENESS_TEXT_CLASS[getLatenessLevel(oldestMinutes)],
    },
  ];

  return (
    <>
      <style href="orders-stats-ticker" precedence="default">
        {TICKER_CSS}
      </style>
      <HoverTooltip content={t("actions.expandStats")} side="left">
        <button
          type="button"
          onClick={onExpand}
          aria-label={t("actions.expandStats")}
          className="group w-full h-full flex flex-col items-center overflow-hidden bg-slate-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="w-full flex flex-col items-center gap-2 pt-3 pb-2.5 border-b border-white/10 shrink-0">
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-bold tracking-wider text-emerald-400">
              {t("metrics.live")}
            </span>
          </div>
          <div className="relative flex-1 w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]">
            <div className="absolute inset-0 flex justify-center rotate-180">
              {/* `self-start` keeps the track at its real height; stretched to the
                  rail height, -50% would only travel half the visible area and
                  jump on restart. The animation itself lives in TICKER_CSS. */}
              <div className="orders-ticker-track inline-flex self-start [writing-mode:vertical-rl]">
                <TickerCopy items={items} />
                <TickerCopy items={items} />
              </div>
            </div>
          </div>
        </button>
      </HoverTooltip>
    </>
  );
}
