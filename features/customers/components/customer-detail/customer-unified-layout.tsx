"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Customer } from "../../types";
import { CustomerSidebar } from "./customer-sidebar";
import { MetricsSection } from "./sections/metrics-section";
import { OrdersSection } from "./sections/orders-section";
import { FavoritesSection } from "./sections/favorites-section";

interface CustomerUnifiedLayoutProps {
  customer: Customer;
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/customers")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tc("buttons.back")}</span>
            </Button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {customer.name || t("detail.anonymous")}
              </h1>
              <p className="text-sm text-slate-500 hidden sm:block">
                {customer.phoneNumber}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(whatsappLink, "_blank", "noopener,noreferrer")
            }
            className="shrink-0"
          >
            <MessageCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="hidden sm:inline">{t("detail.whatsapp")}</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-80 border-r border-slate-200 bg-white overflow-hidden">
          <CustomerSidebar
            customer={customer}
            notes={notes}
            onNotesChange={onNotesChange}
            onNotesSave={onNotesSave}
            isSaving={isSavingNotes}
          />
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
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
                    {customer.name?.charAt(0).toUpperCase() || customer.phoneNumber.charAt(0)}
                  </span>
                  {t("detail.customerInfo")}
                </span>
                {isMobileSidebarOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {isMobileSidebarOpen && (
                <div className="mt-3 border rounded-lg bg-white overflow-hidden">
                  <CustomerSidebar
                    customer={customer}
                    notes={notes}
                    onNotesChange={onNotesChange}
                    onNotesSave={onNotesSave}
                    isSaving={isSavingNotes}
                  />
                </div>
              )}
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
