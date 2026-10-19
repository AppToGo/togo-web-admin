"use client";

/**
 * Panel de análisis del comprobante.
 *
 * Togo analiza y propone; el negocio decide. Esta tarjeta nunca confirma
 * el pago: muestra el índice con su medidor, la tabla pedido vs comprobante
 * (problemas primero), los chequeos extra y el conteo de coincidencias. El
 * botón de confirmar vive en el diálogo.
 */

import { useTranslations, useLocale } from "next-intl";
import {
  AlertTriangle,
  Check,
  Loader2,
  Minus,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrderPaymentVerification } from "../hooks/useOrderPaymentVerification";
import type {
  ProofComparisonRow,
  VerificationSignal,
} from "../services/order.service";

type ChipStatus = "fail" | "warn" | "ok" | "na";

const CHIP_STYLES: Record<ChipStatus, { fg: string; bg: string }> = {
  fail: { fg: "#dc2626", bg: "#fef2f2" },
  warn: { fg: "#d97706", bg: "#fffbeb" },
  ok: { fg: "#16a34a", bg: "#f0fdf4" },
  na: { fg: "#94a3b8", bg: "#f8fafc" },
};

function toChip(
  status: VerificationSignal["status"] | ProofComparisonRow["status"]
): ChipStatus {
  switch (status) {
    case "FAIL":
      return "fail";
    case "WARNING":
      return "warn";
    case "PASS":
      return "ok";
    default:
      return "na";
  }
}

/** El nivel lo manda el backend (`riskLevel`): el front no reumbraliza. */
function levelStyles(level: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN") {
  switch (level) {
    case "LOW":
      return {
        fg: "#16a34a",
        soft: "#f0fdf4",
        ring: "#bbf7d0",
        label: "verificationHigh" as const,
        tip: "verificationTipHigh" as const,
      };
    case "MEDIUM":
      return {
        fg: "#d97706",
        soft: "#fffbeb",
        ring: "#fde68a",
        label: "verificationMedium" as const,
        tip: "verificationTipMedium" as const,
      };
    case "HIGH":
      return {
        fg: "#dc2626",
        soft: "#fef2f2",
        ring: "#fecaca",
        label: "verificationLow" as const,
        tip: "verificationTipLow" as const,
      };
    default:
      return {
        fg: "#64748b",
        soft: "#f8fafc",
        ring: "#e2e8f0",
        label: null,
        tip: null,
      };
  }
}

const SEVERITY_ORDER: Record<ChipStatus, number> = {
  fail: 0,
  warn: 1,
  ok: 2,
  na: 3,
};

const ROW_LABELS = {
  amount: "rowAmount",
  date: "rowDate",
  sender: "rowSender",
  beneficiary: "rowBeneficiary",
  currency: "rowCurrency",
} as const;

const COUNT_KEYS = {
  fail: "countFail",
  warn: "countWarn",
  ok: "countOk",
} as const;

/** Chequeos que no son campo a campo: van en la lista de abajo. */
const EXTRA_CODES = new Set(["DUPLICATE_CHECK", "DOCUMENT_INTEGRITY"]);

function Gauge({ score, color }: { score: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#fff" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="text-[20px] font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="mt-0.5 text-[9px] font-semibold text-slate-500">
          /100
        </span>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: ChipStatus }) {
  const t = useTranslations("orders");
  const style = CHIP_STYLES[status];
  const Icon =
    status === "fail"
      ? X
      : status === "warn"
        ? AlertTriangle
        : status === "ok"
          ? Check
          : Minus;
  const label =
    status === "fail"
      ? t("paymentProof.chipFail")
      : status === "warn"
        ? t("paymentProof.chipWarn")
        : status === "ok"
          ? t("paymentProof.chipOk")
          : t("paymentProof.chipNa");
  return (
    <span
      className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full py-0 pl-1.5 pr-2 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.fg }}
    >
      <Icon size={12} strokeWidth={2.6} />
      {label}
    </span>
  );
}

function SignalRow({ signal }: { signal: VerificationSignal }) {
  const Icon =
    signal.status === "FAIL"
      ? X
      : signal.status === "WARNING"
        ? AlertTriangle
        : signal.status === "PASS"
          ? Check
          : Minus;
  const color =
    signal.status === "FAIL"
      ? "text-rose-700"
      : signal.status === "WARNING"
        ? "text-amber-700"
        : signal.status === "PASS"
          ? "text-emerald-700"
          : "text-slate-400";
  return (
    <li className="flex items-start gap-2 text-xs text-slate-700">
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", color)} />
      <span>{signal.description}</span>
    </li>
  );
}

function formatCellValue(
  row: ProofComparisonRow,
  side: "expected" | "received",
  locale: string,
  currency: string,
  noData: string
): string {
  const value = row[side];
  if (value === null || value === undefined || value === "") return noData;
  if (row.key === "amount" && typeof value === "number") {
    // Sin decimales solo si el valor no los tiene: redondear siempre hacía
    // que 25,99 y 25,50 se vieran iguales ("$26") con el chip "No coincide".
    const fractionDigits = Number.isInteger(value) ? 0 : 2;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(value);
    } catch {
      return String(value);
    }
  }
  // Las dos fechas (la del pedido y la extraída del comprobante) llegan como
  // `yyyy-MM-dd`: se pintan igual, local y sin hora. Formatear solo una hacía
  // que una fila "Coincide" mostrara "5/10/2026" junto a "2026-10-05".
  if (row.key === "date" && typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) {
      const day = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );
      return day.toLocaleDateString(locale, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    }
  }
  return String(value);
}

export function PaymentVerificationCard({ orderId }: { orderId: string }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { data, isLoading } = useOrderPaymentVerification(orderId, true);

  if (isLoading) {
    return <Skeleton className="h-28 w-full rounded-lg" />;
  }

  // Sin análisis todavía: no se muestra nada (el 404 no es error).
  if (!data) return null;

  if (
    data.analysisStatus === "PENDING" ||
    data.analysisStatus === "FAILED"
  ) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("paymentProof.verificationPending")}
      </div>
    );
  }

  if (
    data.analysisStatus === "INCONCLUSIVE" ||
    data.analysisStatus === "QUOTA_EXCEEDED"
  ) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {t(
            data.analysisStatus === "INCONCLUSIVE"
              ? "paymentProof.verificationInconclusive"
              : "paymentProof.verificationQuotaExceeded"
          )}
        </span>
      </div>
    );
  }

  const styles = levelStyles(data.riskLevel);
  const score = data.confidenceScore ?? 0;
  const rows = [...(data.comparison ?? [])].sort(
    (a, b) => SEVERITY_ORDER[toChip(a.status)] - SEVERITY_ORDER[toChip(b.status)]
  );
  const extras = (data.signals ?? []).filter((signal) =>
    EXTRA_CODES.has(signal.code)
  );
  const currencyRow = (data.comparison ?? []).find(
    (row) => row.key === "currency"
  );
  const currency =
    typeof currencyRow?.expected === "string" && currencyRow.expected
      ? currencyRow.expected
      : "COP";

  // Conteo del encabezado: filas más chequeos extra, sin los "sin dato".
  const counted: ChipStatus[] = [
    ...rows.map((row) => toChip(row.status)),
    ...extras.map((signal) => toChip(signal.status)),
  ];
  const count = (status: ChipStatus) =>
    counted.filter((item) => item === status).length;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-center gap-4 rounded-2xl p-4"
        style={{
          background: styles.soft,
          boxShadow: `inset 0 0 0 1px ${styles.ring}`,
        }}
      >
        <Gauge score={score} color={styles.fg} />
        <div className="min-w-0 flex-1">
          {styles.label && (
            <div
              className="text-[18px] font-bold"
              style={{ color: styles.fg }}
            >
              {t(`paymentProof.${styles.label}`)}
            </div>
          )}
          {styles.tip && (
            <div className="text-[14px] text-slate-700">
              {t(`paymentProof.${styles.tip}`)}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1 text-[12px] font-semibold tabular-nums">
          {(["fail", "warn", "ok"] as const).map((status) =>
            count(status) > 0 ? (
              <span
                key={status}
                className="inline-flex items-center gap-1.5"
                style={{ color: CHIP_STYLES[status].fg }}
              >
                <StatusChipIcon status={status} />
                {t(`paymentProof.${COUNT_KEYS[status]}`, {
                  count: count(status),
                })}
              </span>
            ) : null
          )}
        </div>
      </div>

      {rows.length > 0 ? (
        <div>
          <div className="grid grid-cols-[96px_minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span />
            <span>{t("paymentProof.tableOrder")}</span>
            <span>{t("paymentProof.tableProof")}</span>
            <span className="w-[104px]" />
          </div>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[96px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-3"
                style={{
                  background:
                    row.status === "FAIL" ? "#fffafa" : undefined,
                }}
              >
                <span className="text-[13px] text-slate-500">
                  {t(`paymentProof.${ROW_LABELS[row.key]}`)}
                </span>
                <span className="truncate text-[14px] font-medium tabular-nums text-slate-800">
                  {formatCellValue(
                    row,
                    "expected",
                    locale,
                    currency,
                    t("paymentProof.noData")
                  )}
                </span>
                <div className="min-w-0">
                  <div
                    className="truncate text-[14px] font-semibold tabular-nums"
                    style={{
                      color:
                        row.status === "FAIL"
                          ? CHIP_STYLES.fail.fg
                          : "#0f172a",
                    }}
                  >
                    {formatCellValue(
                      row,
                      "received",
                      locale,
                      currency,
                      t("paymentProof.noData")
                    )}
                  </div>
                  {row.note && (
                    <div className="truncate text-[12px] text-slate-500">
                      {row.note}
                    </div>
                  )}
                </div>
                <span className="flex w-[104px] justify-end">
                  <StatusChip status={toChip(row.status)} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Análisis viejos (sin comparativa guardada): la lista de siempre.
        data.signals.length > 0 && (
          <ul className="space-y-1">
            {data.signals.map((signal, index) => (
              <SignalRow
                key={`${signal.code}-${index}`}
                signal={signal}
              />
            ))}
          </ul>
        )
      )}

      {extras.length > 0 && (
        <div className="flex flex-col gap-2">
          {extras.map((signal, index) => {
            const chip = toChip(signal.status);
            const style = CHIP_STYLES[chip];
            const Icon =
              chip === "fail"
                ? X
                : chip === "warn"
                  ? AlertTriangle
                  : chip === "ok"
                    ? Check
                    : Minus;
            return (
              <div
                key={`${signal.code}-${index}`}
                className="flex items-center gap-2.5 text-[13px] text-slate-600"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: style.bg, color: style.fg }}
                >
                  <Icon size={12} strokeWidth={2.6} />
                </span>
                {signal.description}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusChipIcon({ status }: { status: ChipStatus }) {
  if (status === "fail") return <X size={12} strokeWidth={2.6} />;
  if (status === "warn")
    return <AlertTriangle size={12} strokeWidth={2.6} />;
  return <Check size={12} strokeWidth={2.6} />;
}
