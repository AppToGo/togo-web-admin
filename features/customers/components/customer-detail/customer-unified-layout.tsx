"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Customer, CustomerAddress } from "../../types";
import { MetricsSection } from "./sections/metrics-section";
import { OrdersSection } from "./sections/orders-section";
import { FavoritesSection } from "./sections/favorites-section";
import { AddressList } from "./address-list";
import { useFormatDate } from "@/hooks/useFormatDate";

interface CustomerUnifiedLayoutProps {
  customer: Customer | null;
  customerId: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onNotesSave: () => void;
  isSavingNotes: boolean;
  whatsappLink: string;
}

export function CustomerUnifiedLayout({
  customer,
  customerId,
  notes,
  onNotesChange,
  onNotesSave,
  isSavingNotes,
  whatsappLink,
}: CustomerUnifiedLayoutProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const hasPhoneNumber = Boolean(customer.phoneNumber?.trim());
  const addresses: CustomerAddress[] = customer.addresses || [];

  const handleWhatsAppClick = () => {
    if (hasPhoneNumber) {
      window.open(whatsappLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30  px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push("/dashboard/customers")}
              className="shrink-0 cursor-pointer pl-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {customer.name || t("detail.anonymous")}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phoneNumber}
                  </div>
                  {customer.email && (
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-0.5">
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </div>
                  )}
                  {customerSince && (
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-0.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("detail.customerSince")} :{" "}
                      <span className="capitalize">{customerSince || "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppClick}
            disabled={!hasPhoneNumber}
            className="shrink-0"
            title={
              hasPhoneNumber ? t("detail.whatsapp") : t("detail.noPhoneNumber")
            }
          >
            <MessageCircle
              className={`h-4 w-4 mr-2 ${hasPhoneNumber ? "text-green-600" : "text-slate-400"}`}
            />
            <span className="hidden sm:inline">{t("detail.whatsapp")}</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {customer.name?.charAt(0).toUpperCase() ||
                      customer.phoneNumber.charAt(0)}
                  </span>
                  {t("detail.customerInfo")}
                </span>
                {isMobileSidebarOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Metrics Grid - Full width */}
            <section>
              <MetricsSection customerId={customerId} />
            </section>

            {/* Split layout: Orders (2/3) | Favorites (1/3) */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Orders - Takes 2 columns */}
              <div className="xl:col-span-2">
                <OrdersSection customerId={customerId} />
              </div>

              {/* Favorites - Takes 1 column */}
              <div className="xl:col-span-1">
                <FavoritesSection customerId={customerId} />
                {addresses.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <AddressList
                      addresses={addresses}
                      translations={{
                        title: t("detail.addresses"),
                        defaultLabel: t("detail.default"),
                        showMore: t("detail.showMore"),
                        showLess: t("detail.showLess"),
                      }}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Bottom spacing for mobile scroll */}
            <div className="h-8 lg:h-0" />
          </div>
        </main>
      </div>
    </div>
  );
}
