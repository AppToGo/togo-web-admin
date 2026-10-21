/**
 * WhatsAppUsageCard
 * Consumo de mensajería Meta del mes: cupo gratis vs cobrado, con alerta
 * cuando se agota y enlace al Billing Hub. Fuente: Analytics de Meta.
 */

"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWhatsAppUsage } from "../hooks/useWhatsAppUsage";
import { BILLING_HUB_URL } from "../constants";

function barColor(level: string): string {
  if (level === "EXHAUSTED") return "bg-red-500";
  if (level === "WARN") return "bg-amber-500";
  return "bg-green-500";
}

export function WhatsAppUsageCard() {
  const t = useTranslations("whatsapp");
  const { data, isLoading } = useWhatsAppUsage();

  if (isLoading) {
    return <p className="text-sm text-slate-500">…</p>;
  }
  if (!data || data.accounts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {data.accounts.map((account) => {
        const current = account.current;
        const exhausted = current.level === "EXHAUSTED";
        return (
          <div
            key={account.accountId}
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {account.phoneNumber}
              </p>
              {account.status === "PAYMENT_REQUIRED" && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  {t("usage.paymentRequired")}
                </span>
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${barColor(current.level)}`}
                style={{ width: `${Math.min(100, current.percent)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {t("usage.quotaLine", {
                free: current.freeMessages,
                billed: current.billableMessages,
                percent: current.percent,
              })}
            </p>
            {current.costAvailable &&
              current.estimatedCost != null &&
              current.currency && (
                <p className="text-xs text-slate-500">
                  {t("usage.costLine", {
                    cost: current.estimatedCost,
                    currency: current.currency,
                  })}
                </p>
              )}
            {exhausted && (
              <Alert className="mt-2 bg-red-50 border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700 text-xs">
                  {t("usage.exhaustedHint")}{" "}
                  <a
                    href={BILLING_HUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline inline-flex items-center gap-1"
                  >
                    {t("usage.billingHub")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      })}
      {data.botMessagesPerOrder != null && (
        <p className="text-xs text-slate-500">
          {t("usage.botMessagesPerOrder", {
            count: data.botMessagesPerOrder.toFixed(1),
          })}
        </p>
      )}
    </div>
  );
}
