"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useCategories } from "@/features/catalog/hooks";
import { ImportPageClient } from "@/features/products/import/components/ImportPageClient";
import type { BusinessCategory } from "@/features/catalog/types/catalog.types";

export default function ImportProductsPage() {
  const t = useTranslations("catalog");

  useAuthGuard();
  const businessId = useEffectiveBusinessId();

  const { data: categoriesData } = useCategories(businessId ?? "");
  const categories: BusinessCategory[] = Array.isArray(categoriesData)
    ? categoriesData
    : [];

  if (!businessId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("noBusiness.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("noBusiness.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ImportPageClient businessId={businessId} categories={categories} />
    </DashboardLayout>
  );
}
