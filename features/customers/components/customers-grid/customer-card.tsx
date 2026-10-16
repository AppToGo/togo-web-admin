"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { formatRelativeDate } from "../../utils/format-relative-date";
import type { CustomerWithMetrics } from "../../types";

/**
 * Tarjeta de un cliente: toda la tarjeta lleva al detalle. En el teléfono
 * el total va a la derecha y pedidos / última compra en etiquetas; desde md
 * los tres números van en una fila de stats.
 */
export function CustomerCard({ customer }: { customer: CustomerWithMetrics }) {
  const t = useTranslations("customers");
  const name = customer.name?.trim();
  const lastOrder = formatRelativeDate(customer.lastOrderAt, t);

  return (
    <Link
      href={`/dashboard/customers/${customer.id}`}
      className="group flex flex-col gap-3 rounded-[20px] border border-white/90 bg-white/65 px-4 py-3.5 transition-colors hover:border-indigo-200 hover:bg-white hover:shadow-card-md md:gap-4 md:rounded-3xl md:p-5"
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={customer.name} seed={customer.id} size="md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={
              name
                ? "truncate text-[15px] font-semibold text-slate-900"
                : "truncate text-[15px] font-semibold text-slate-500"
            }
          >
            {name || t("table.noName")}
          </span>
          <span className="truncate text-[13px] text-slate-500">
            {customer.phoneNumber}
          </span>
        </span>
        {/* Teléfono: el total a la derecha. */}
        <span className="text-[15px] font-bold tabular-nums text-slate-900 md:hidden">
          {formatCurrency(customer.totalSpent)}
        </span>
        <ChevronRight className="hidden h-[18px] w-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-indigo-500 md:block" />
      </div>

      {/* Teléfono: pedidos y última compra en etiquetas. */}
      <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 md:hidden">
        <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5">
          {t("card.orders", { count: customer.totalOrders })}
        </span>
        <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5">
          {t("card.lastOrderShort", { date: lastOrder })}
        </span>
      </div>

      <dl className="hidden grid-cols-3 gap-2 border-t border-slate-200/80 pt-3.5 md:grid">
        <Stat label={t("card.ordersLabel")} value={String(customer.totalOrders)} />
        <Stat label={t("card.spentLabel")} value={formatCurrency(customer.totalSpent)} />
        <Stat label={t("card.lastOrderLabel")} value={lastOrder} />
      </dl>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-[15px] font-semibold tabular-nums text-slate-900">
        {value}
      </dd>
    </div>
  );
}
