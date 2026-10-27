"use client";

/**
 * Funcionalidades por negocio (solo SUPER_ADMIN): activar funcionalidades en
 * varios negocios a la vez, o ver y cambiar las de un negocio.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ToggleRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useBusinesses } from "@/features/orders/hooks/useOrders";
import {
  BusinessFeaturesPanel,
  FeatureBulkPanel,
} from "@/features/admin/feature-flags/components";

export default function AdminFeaturesPage() {
  const t = useTranslations("admin-feature-flags");
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isSuperAdmin = useIsSuperAdmin();
  const { data: businesses } = useBusinesses({ enabled: isSuperAdmin });
  const [businessId, setBusinessId] = useState("");

  const businessOptions = useMemo(
    () => (businesses ?? []).map((b) => ({ value: b.id, label: b.name })),
    [businesses]
  );

  if (isAuthLoading) return null;

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">{t("accessDenied")}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        {/* < lg el nombre de la sección ya está en la barra superior. */}
        <div className="hidden lg:block">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <ToggleRight className="h-6 w-6 text-indigo-600" aria-hidden />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>

        <Tabs defaultValue="bulk">
          <TabsList>
            <TabsTrigger value="bulk">{t("tabs.bulk")}</TabsTrigger>
            <TabsTrigger value="business">{t("tabs.business")}</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk">
            <Card className="p-4 lg:p-6">
              <FeatureBulkPanel />
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card className="space-y-4 p-4 lg:p-6">
              <AutocompleteSelect
                options={businessOptions}
                value={businessId}
                onChange={setBusinessId}
                label={t("business.selectLabel")}
                placeholder={t("business.selectPlaceholder")}
                searchPlaceholder={t("bulk.searchBusiness")}
                emptyMessage={t("bulk.noBusinesses")}
              />
              {businessId ? (
                <BusinessFeaturesPanel businessId={businessId} />
              ) : (
                <p className="text-sm text-slate-500">{t("business.empty")}</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
