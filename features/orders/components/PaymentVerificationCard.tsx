"use client";

/**
 * Tarjeta del índice de confianza del comprobante.
 *
 * Togo analiza y propone; el negocio decide. Esta tarjeta nunca confirma
 * el pago: muestra el índice, las señales y el recordatorio de verificar
 * el ingreso en cuenta. El botón de confirmar vive en el diálogo.
 */

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  Loader2,
  Minus,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrderPaymentVerification } from "../hooks/useOrderPaymentVerification";
import type { VerificationSignal } from "../services/order.service";

const SIGNAL_ICONS = {
  PASS: Check,
  WARNING: AlertTriangle,
  FAIL: XCircle,
  SKIPPED: Minus,
} as const;

const SIGNAL_TEXT = {
  PASS: "text-emerald-700",
  WARNING: "text-amber-700",
  FAIL: "text-rose-700",
  SKIPPED: "text-slate-400",
} as const;

function levelStyles(level: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN") {
  switch (level) {
    case "LOW":
      return {
        container: "border-emerald-200 bg-emerald-50",
        dot: "bg-emerald-500",
        label: "verificationHigh" as const,
      };
    case "MEDIUM":
      return {
        container: "border-amber-200 bg-amber-50",
        dot: "bg-amber-500",
        label: "verificationMedium" as const,
      };
    case "HIGH":
      return {
        container: "border-rose-200 bg-rose-50",
        dot: "bg-rose-500",
        label: "verificationLow" as const,
      };
    default:
      return {
        container: "border-slate-200 bg-slate-50",
        dot: "bg-slate-400",
        label: null,
      };
  }
}

function SignalRow({ signal }: { signal: VerificationSignal }) {
  const Icon = SIGNAL_ICONS[signal.status];
  return (
    <li className="flex items-start gap-2 text-xs text-slate-700">
      <Icon
        className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", SIGNAL_TEXT[signal.status])}
      />
      <span>{signal.description}</span>
    </li>
  );
}

export function PaymentVerificationCard({ orderId }: { orderId: string }) {
  const t = useTranslations("orders");
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

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", styles.container)}>
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", styles.dot)} />
        <p className="text-sm font-semibold text-slate-900">
          {t("paymentProof.verificationTitle", {
            score: data.confidenceScore ?? 0,
          })}
        </p>
      </div>
      {styles.label && (
        <p className="text-xs font-medium text-slate-700">
          {t(`paymentProof.${styles.label}`)}
        </p>
      )}

      {data.signals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {t("paymentProof.verificationSignals")}
          </p>
          <ul className="space-y-1">
            {data.signals.map((signal, index) => (
              <SignalRow
                key={`${signal.code}-${index}`}
                signal={signal}
              />
            ))}
          </ul>
        </div>
      )}

      <p className="flex items-start gap-1.5 border-t border-slate-200/70 pt-2 text-[11px] text-slate-500">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("paymentProof.verificationDisclaimer")}
      </p>
    </div>
  );
}
