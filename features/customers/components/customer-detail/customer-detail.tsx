"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  User,
  MessageCircle,
  Calendar,
  ShoppingBag,
  BarChart3,
  Save,
} from "lucide-react";
import {
  useCustomer,
  useCustomerMetrics,
  useCustomerOrders,
} from "../../hooks";
import { CustomerMetricsCard } from "../customer-metrics/customer-metrics-card";
import { CustomerOrdersTable } from "./customer-orders-table";
import { formatCurrency } from "@/lib/utils";
import { useUpdateCustomer } from "../../hooks";
import { toast } from "sonner";

interface CustomerDetailProps {
  customerId: string;
}

const MAX_NOTES_LENGTH = 1000;

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [notes, setNotes] = useState("");

  // Queries
  const { data: customer, isLoading: isLoadingCustomer } =
    useCustomer(customerId);
  const { data: metrics, isLoading: isLoadingMetrics } = useCustomerMetrics(
    customerId,
    activeTab === "metrics"
  );
  const {
    data: orders,
    meta: ordersMeta,
    isLoading: isLoadingOrders,
  } = useCustomerOrders(customerId, 1, 10, activeTab === "orders");

  // Mutación
  const updateCustomer = useUpdateCustomer();

  // Guardar notas
  const handleSaveNotes = async () => {
    try {
      await updateCustomer.mutateAsync({
        customerId,
        data: { notes },
      });
    } catch {
      // Error ya manejado en el hook
    }
  };

  // Loading skeleton
  if (isLoadingCustomer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-slate-900">
          {t("detail.notFound")}
        </h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/customers">{tc("buttons.back")}</Link>
        </Button>
      </div>
    );
  }

  const whatsappLink = `https://wa.me/${customer.phoneNumber.replace(/\D/g, "")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/dashboard/customers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc("buttons.back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {customer.name || t("detail.anonymous")}
            </h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Phone className="h-4 w-4" />
              {customer.phoneNumber}
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(whatsappLink, '_blank', 'noopener,noreferrer')}
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
          {t("detail.whatsapp")}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-flex">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("detail.information")}</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("detail.metrics")}</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">{t("detail.orders")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-slate-500" />
                  {t("detail.basicInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">
                      {t("detail.fields.name")}
                    </label>
                    <p className="text-slate-900">
                      {customer.name || t("detail.anonymous")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">
                      {t("detail.fields.phone")}
                    </label>
                    <p className="text-slate-900">{customer.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">
                      {t("detail.fields.email")}
                    </label>
                    <p className="text-slate-900">{customer.email || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">
                      {t("detail.fields.registered")}
                    </label>
                    <p className="text-slate-900 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(customer.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direcciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  {t("detail.addresses")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.addresses && customer.addresses.length > 0 ? (
                  <div className="space-y-3">
                    {customer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              {t("detail.default")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {address.addressText}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">
                    {t("detail.noAddresses")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.notes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t("detail.notesPlaceholder")}
                value={notes || customer.notes || ""}
                onChange={(e) =>
                  setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))
                }
                maxLength={MAX_NOTES_LENGTH}
                rows={4}
              />
              <div className="text-xs text-slate-500 mt-1 text-right">
                {(notes || customer.notes || "").length}/{MAX_NOTES_LENGTH}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotes}
                  disabled={updateCustomer.isPending}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {tc("buttons.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Métricas */}
        <TabsContent value="metrics">
          {isLoadingMetrics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : metrics ? (
            <CustomerMetricsCard metrics={metrics} />
          ) : null}
        </TabsContent>

        {/* Tab: Pedidos */}
        <TabsContent value="orders">
          {isLoadingOrders ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <CustomerOrdersTable
              orders={orders || []}
              totalCount={ordersMeta?.total || 0}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
