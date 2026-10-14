"use client";

/**
 * Clientes en el teléfono (< md): la tabla pasa a una lista de tarjetas con
 * lo que se mira para decidir (nombre, teléfono, última compra, total y
 * pedidos). Tocar una abre el detalle.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { formatRelativeDate } from "./columns";
import type { CustomerWithMetrics } from "../../types";

export function CustomersMobileList({ data }: { data: CustomerWithMetrics[] }) {
  const t = useTranslations("customers");

  return (
    <ul
      className="md:hidden divide-y divide-slate-100 overflow-hidden rounded-card bg-white"
      data-testid="customers-mobile-list"
    >
      {data.map((customer) => (
        <li key={customer.id}>
          <Link
            href={`/dashboard/customers/${customer.id}`}
            className="flex min-h-[68px] items-center gap-3 px-4 py-2.5"
          >
            <InitialsAvatar name={customer.name} seed={customer.id} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px] font-semibold text-slate-900">
                {customer.name ?? t("table.noName")}
              </span>
              <span className="truncate text-xs text-slate-500">
                {customer.phoneNumber} · {formatRelativeDate(customer.lastOrderAt, t)}
              </span>
            </span>
            <span className="flex flex-col items-end gap-0.5">
              <span className="text-sm font-bold tabular-nums text-slate-900">
                {formatCurrency(customer.totalSpent)}
              </span>
              <span className="text-xs text-slate-500">
                {customer.totalOrders} {t("table.columns.orders")}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
