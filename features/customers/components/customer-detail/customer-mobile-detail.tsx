"use client";

/**
 * Detalle del cliente en el teléfono (< md), según el diseño móvil: cabecera
 * con volver, datos y acciones (Llamar · Abrir conversación) y tres
 * pestañas — Resumen (métricas, favoritos, direcciones), Pedidos y Notas.
 * En pantallas grandes se usa `CustomerUnifiedLayout`.
 */

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { MessageCircle, Phone } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { MobileScreen } from "@/components/layout/MobileScreen";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { useFormatDate } from "@/hooks/useFormatDate";
import { OrderDetailDialog } from "@/features/orders/components/OrderDetailDialog";
import { useCustomerMetrics, useCustomerOrders } from "../../hooks/useCustomer";
import { MAX_NOTES_LENGTH } from "../../constants";
import type { Customer } from "../../types";
import { daysBetweenOrders } from "../../utils/order-frequency";

type Tab = "summary" | "orders" | "notes";

interface CustomerMobileDetailProps {
  customer: Customer;
  customerId: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  isSavingNotes: boolean;
  conversationHref: string | null;
}

export function CustomerMobileDetail({
  customer,
  customerId,
  notes,
  onNotesChange,
  isSavingNotes,
  conversationHref,
}: CustomerMobileDetailProps) {
  const t = useTranslations("customers");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("summary");
  const customerSince = useFormatDate(customer.createdAt, { preset: "monthYear" });

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "summary", label: t("detail.mobile.tabs.summary") },
    { id: "orders", label: t("detail.mobile.tabs.orders") },
    { id: "notes", label: t("detail.notes") },
  ];

  return (
    <MobileScreen
      hiddenFrom="md"
      onBack={() => router.push("/dashboard/customers")}
      backLabel={t("detail.mobile.back")}
      title={<h1 className="text-[17px] font-bold text-slate-900">{t("detail.customer")}</h1>}
      testId="customer-mobile-detail"
      seamlessHeader
      bodyClassName="p-3"
      subheader={
        <section
          aria-label={t("detail.customer")}
          className="flex shrink-0 flex-col gap-3.5 border-b border-slate-200/70 bg-white px-4 pb-3.5 pt-1"
        >
          <div className="flex items-center gap-3">
            <InitialsAvatar name={customer.name} seed={customer.id} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[19px] font-bold text-slate-900">
                {customer.name || t("detail.anonymous")}
              </span>
              <span className="truncate text-[13px] text-slate-500">
                {customer.phoneNumber}
                {customerSince &&
                  ` · ${t("detail.mobile.since", { date: customerSince })}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${customer.phoneNumber}`}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
            >
              <Phone className="h-[17px] w-[17px]" />
              {t("detail.mobile.call")}
            </a>
            {conversationHref ? (
              <Link
                href={conversationHref}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-[17px] w-[17px]" />
                {t("detail.openConversation")}
              </Link>
            ) : (
              // Sin ventana de 24 h abierta WhatsApp no deja escribir texto
              // libre: el acceso se muestra apagado en vez de esconderse.
              <span
                aria-disabled
                title={t("detail.mobile.noConversation")}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-400"
              >
                <MessageCircle className="h-[17px] w-[17px]" />
                {t("detail.openConversation")}
              </span>
            )}
          </div>

          <div
            role="tablist"
            aria-label={t("detail.mobile.sections")}
            className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-9 rounded-[9px] text-sm font-semibold transition-colors",
                  tab === item.id
                    ? "bg-white text-indigo-700 shadow-card-sm"
                    : "text-slate-600"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      }
    >
      {tab === "summary" && <SummaryTab customer={customer} customerId={customerId} />}
      {tab === "orders" && <OrdersTab customerId={customerId} />}
      {tab === "notes" && (
        <label className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 text-sm font-semibold text-slate-600">
          <span className="flex items-center justify-between">
            {t("detail.notes")}
            {isSavingNotes && (
              <span className="text-xs font-normal text-slate-400">
                {t("detail.mobile.saving")}
              </span>
            )}
          </span>
          <textarea
            rows={6}
            value={notes}
            maxLength={MAX_NOTES_LENGTH}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder={t("detail.notesPlaceholder")}
            className="resize-none rounded-xl border border-slate-200 p-3 text-[15px] font-normal text-slate-900 outline-none focus:border-indigo-400"
          />
        </label>
      )}
    </MobileScreen>
  );
}

/** Mismos tonos que las métricas del detalle en escritorio. */
const TILE_TONES = {
  emerald: "bg-gradient-to-br from-emerald-400/15 via-white/60 to-emerald-500/20",
  blue: "bg-gradient-to-br from-blue-400/15 via-white/60 to-blue-500/20",
  purple: "bg-gradient-to-br from-purple-400/15 via-white/60 to-purple-500/20",
  amber: "bg-gradient-to-br from-amber-400/15 via-white/60 to-amber-500/20",
} as const;

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof TILE_TONES;
}) {
  return (
    <div className={`rounded-2xl border border-white/90 p-3 ${TILE_TONES[tone]}`}>
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="text-[19px] font-bold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

function SummaryTab({ customer, customerId }: { customer: Customer; customerId: string }) {
  const t = useTranslations("customers");
  const { data: metrics, isLoading } = useCustomerMetrics(customerId, true);

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const every = daysBetweenOrders(metrics);
  const favorites = metrics.favoriteProducts?.slice(0, 5) ?? [];
  const addresses = customer.addresses ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Tile tone="emerald" label={t("metrics.totalSpent")} value={formatCurrency(metrics.totalSpent)} />
        <Tile tone="blue" label={t("detail.mobile.tabs.orders")} value={String(metrics.totalOrders)} />
        <Tile tone="purple" label={t("metrics.averageOrder")} value={formatCurrency(metrics.avgOrderValue)} />
        <Tile
          tone="amber"
          label={t("detail.mobile.ordersEvery")}
          value={every === null ? "—" : t("detail.mobile.days", { count: every })}
        />
      </div>

      <section className="flex flex-col gap-2.5 rounded-2xl bg-white p-3.5">
        <h2 className="text-[15px] font-bold text-slate-900">{t("metrics.favoriteProducts")}</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-slate-500">{t("detail.noFavorites")}</p>
        ) : (
          favorites.map((product) => (
            <div key={product.productId} className="flex justify-between gap-3 text-sm">
              <span className="truncate text-slate-900">{product.name}</span>
              <span className="shrink-0 text-slate-500">
                {t("detail.mobile.times", { count: product.totalQuantity })}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-white p-3.5">
        <h2 className="text-[15px] font-bold text-slate-900">{t("detail.addresses")}</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-slate-500">{t("detail.noAddresses")}</p>
        ) : (
          addresses.map((address) => (
            <span
              key={address.id}
              className={cn(
                "flex flex-wrap items-center gap-2 text-sm",
                address.isDefault ? "text-slate-900" : "text-slate-600"
              )}
            >
              {address.addressText}
              {address.isDefault && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                  {t("detail.default")}
                </span>
              )}
            </span>
          ))
        )}
      </section>
    </div>
  );
}

function OrdersTab({ customerId }: { customerId: string }) {
  const t = useTranslations("customers");
  const to = useTranslations("orders");
  const format = useFormatter();
  const { data: orders, meta, isLoading } = useCustomerOrders(customerId, 1, 10, true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="rounded-2xl bg-white px-4 py-10 text-center">
        <p className="font-medium text-slate-900">{t("detail.noOrders")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("detail.noOrdersDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white">
        {orders.map((order) => {
          const payment = [
            order.paymentMethod
              ? to.has(`paymentMethods.${order.paymentMethod}`)
                ? to(`paymentMethods.${order.paymentMethod}`)
                : order.paymentMethod
              : null,
            to.has(`paymentStatus.${order.paymentStatus}`)
              ? to(`paymentStatus.${order.paymentStatus}`)
              : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setOpenOrderId(order.id)}
                className="flex min-h-[60px] w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    #{order.orderNumber ?? order.id.slice(-6).toUpperCase()} ·{" "}
                    {format.dateTime(new Date(order.createdAt), {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {to.has(`status.${order.status}`) ? to(`status.${order.status}`) : order.status}
                    {payment && ` · ${payment}`}
                  </span>
                </span>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {formatCurrency(order.total ?? order.totalAmount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {(meta?.total ?? 0) > orders.length && (
        <p className="text-center text-xs text-slate-500">
          {t("detail.ordersTable.showing", { shown: orders.length, total: meta?.total ?? 0 })}
        </p>
      )}
      <OrderDetailDialog
        orderId={openOrderId ?? ""}
        isOpen={!!openOrderId}
        onClose={() => setOpenOrderId(null)}
        isReadOnly
      />
    </div>
  );
}
