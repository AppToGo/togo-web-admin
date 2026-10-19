"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Phone, Mail, Calendar } from "lucide-react";
import { Link } from "@/i18n/routing";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useRouter } from "next/navigation";
import type { Customer, CustomerAddress } from "../../types";
import { MetricsSection } from "./sections/metrics-section";
import { OrdersSection } from "./sections/orders-section";
import { FavoritesSection } from "./sections/favorites-section";
import { ConversationsSection } from "./sections/conversations-section";
import { AddressList } from "./address-list";
import { CustomerNotesCard } from "./customer-notes-card";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CustomerMobileDetail } from "./customer-mobile-detail";

/** Botones del encabezado: altos y redondeados como los del Inbox. */
const HEADER_BUTTON = "h-11 rounded-[14px] px-4";

interface CustomerUnifiedLayoutProps {
  customer: Customer | null;
  customerId: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onNotesSave: () => void;
  isSavingNotes: boolean;
  /** Inbox con la conversación abierta del cliente; null si no hay ventana de 24 h abierta. */
  conversationHref: string | null;
}

export function CustomerUnifiedLayout({
  customer,
  customerId,
  notes,
  onNotesChange,
  isSavingNotes,
  conversationHref,
}: CustomerUnifiedLayoutProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const router = useRouter();
  // Teléfono: pantalla propia con pestañas (diseño móvil). Se elige una sola
  // versión para no montar las dos ni pedir sus datos dos veces.
  const isMobile = useIsMobile();

  // Formatear fecha de creación del cliente
  const customerSince = useFormatDate(customer?.createdAt, {
    preset: "monthYear",
  });

  // Fallback UI si no hay customer
  if (!customer) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {t("detail.notFound")}
          </h2>
          <p className="text-slate-500">{t("detail.notFoundDescription")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/customers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc("buttons.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <CustomerMobileDetail
        customer={customer}
        customerId={customerId}
        notes={notes}
        onNotesChange={onNotesChange}
        isSavingNotes={isSavingNotes}
        conversationHref={conversationHref}
      />
    );
  }

  const addresses: CustomerAddress[] = customer.addresses || [];

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("detail.backToList")}
      </Link>

      {/* Encabezado del cliente */}
      <section
        aria-label={t("detail.customer")}
        className="flex flex-wrap items-center justify-between gap-5 rounded-card-xl border border-white/80 bg-white/45 p-6 backdrop-blur-xl"
      >
        <div className="flex min-w-0 items-center gap-4">
          <InitialsAvatar
            name={customer.name}
            seed={customer.id}
            size="lg"
            className="h-16 w-16 text-[22px]"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {customer.name || t("detail.anonymous")}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {customer.phoneNumber}
              </span>
              {customer.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {customer.email}
                </span>
              )}
              {customerSince && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {t("detail.customerSince")}{" "}
                  <span className="capitalize">{customerSince}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button asChild variant="slate-outline" className={HEADER_BUTTON}>
            <a href={`tel:${customer.phoneNumber}`}>
              <Phone />
              {t("detail.mobile.call")}
            </a>
          </Button>
          {conversationHref ? (
            <Button asChild className={HEADER_BUTTON}>
              <Link href={conversationHref}>
                <MessageCircle />
                {t("detail.openConversation")}
              </Link>
            </Button>
          ) : (
            // Sin ventana de 24 h abierta WhatsApp no deja escribir texto
            // libre: el acceso se muestra apagado (con el motivo) en vez de
            // desaparecer.
            <Button
              disabled
              className={HEADER_BUTTON}
              title={t("detail.mobile.noConversation")}
            >
              <MessageCircle />
              {t("detail.openConversation")}
            </Button>
          )}
        </div>
      </section>

      <MetricsSection customerId={customerId} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <OrdersSection customerId={customerId} />
          <ConversationsSection customerId={customerId} />
        </div>
        <div className="space-y-5">
          <CustomerNotesCard
            notes={notes}
            onNotesChange={onNotesChange}
            isSavingNotes={isSavingNotes}
          />
          <FavoritesSection customerId={customerId} />
          {addresses.length > 0 && <AddressList addresses={addresses} />}
        </div>
      </div>
    </div>
  );
}
