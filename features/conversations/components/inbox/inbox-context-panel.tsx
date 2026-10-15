"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { ConversationDetail } from "../../types";

const WINDOW_MS = 24 * 60 * 60 * 1000;

interface InboxContextPanelProps {
  conversation: ConversationDetail;
}

/** Hora actual que se renueva cada minuto (cuenta regresiva de la ventana). */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Datos del cliente y de la conversación junto al hilo: para responder sin
 * salir del Inbox (cuánto queda de la ventana de 24 h, pedidos, a quién
 * está asignada). Solo con ancho de sobra (≥ xl).
 */
export function InboxContextPanel({ conversation }: InboxContextPanelProps) {
  const t = useTranslations("inbox.context");
  const locale = useLocale();
  const now = useNow();

  const customer = conversation.customer;
  const expiresAt = conversation.windowExpiresAt
    ? new Date(conversation.windowExpiresAt).getTime()
    : null;
  const remainingMs = expiresAt !== null ? Math.max(0, expiresAt - now) : 0;
  const windowOpen = remainingMs > 0;
  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);

  const startedAt = new Date(conversation.startedAt);
  const startedLabel = startedAt.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <aside
      aria-label={t("title")}
      className="hidden w-64 shrink-0 flex-col gap-5 overflow-y-auto rounded-card-xl border border-white/80 bg-white/45 p-5 backdrop-blur-xl xl:flex"
    >
      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t("customer")}
        </h3>
        <p className="font-semibold text-slate-900">
          {customer?.name ?? t("noName")}
        </p>
        <p className="text-sm text-slate-600">{conversation.phoneNumber}</p>
        {customer && (
          <Link
            href={`/dashboard/customers/${customer.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t("viewCustomer")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </section>

      <div className="h-px bg-white/90" />

      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t("window")}
        </h3>
        {windowOpen ? (
          <>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-600">{t("windowRemaining")}</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {t("windowTime", { hours, minutes })}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/80">
              <div
                className={cn(
                  "h-full rounded-full",
                  remainingMs < 2 * 3_600_000 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, (remainingMs / WINDOW_MS) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{t("windowHint")}</p>
          </>
        ) : (
          <p className="text-sm text-amber-700">{t("windowClosed")}</p>
        )}
      </section>

      <div className="h-px bg-white/90" />

      <section className="space-y-2.5 text-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t("conversation")}
        </h3>
        <Row label={t("startedAt")} value={startedLabel} />
        <Row label={t("messages")} value={String(conversation.messageCount)} />
        <Row
          label={t("orders")}
          value={
            conversation.orderIds.length > 0
              ? t("ordersCount", { count: conversation.orderIds.length })
              : t("noOrders")
          }
        />
        <Row
          label={t("assignedTo")}
          value={conversation.assignedTo?.name ?? t("nobody")}
        />
      </section>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
