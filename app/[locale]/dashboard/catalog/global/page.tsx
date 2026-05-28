"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package, Store, Grid3X3 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGlobalCatalog,
  useIndustryCategories,
  useActivateCatalogProduct,
  useCategories,
} from "@/features/catalog/hooks";
import {
  GlobalProductCard,
  GlobalCatalogFilters,
  ActivateProductDrawer,
} from "@/features/catalog/components";
import { getVariants } from "@/features/catalog/services/catalog.service";
import { activateProduct } from "@/features/branch-inventory/services/branch-inventory.service";
import type {
  GlobalProduct,
  ActivateCatalogProductDto,
} from "@/features/catalog/types";
import type { BranchActivation } from "@/features/catalog/components/ProductForm";

type ViewMode = "grid" | "list";

const globalPageSize = 20;

function GlobalCatalogLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-card-lg overflow-hidden border border-slate-100"
        >
          <Skeleton className="aspect-4/3" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyGlobalCatalogState() {
  const t = useTranslations("catalog");
  return (
    <div className="text-center py-16 bg-slate-50 rounded-card-lg border border-dashed border-slate-200">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <Grid3X3 className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {t("globalCatalog.empty.title")}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        {t("globalCatalog.empty.message")}
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: Error | null }) {
  const t = useTranslations("catalog");
  return (
    <div className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <Grid3X3 className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        {t("globalCatalog.error.title") || "Error loading catalog"}
      </h3>
      <p className="text-sm text-red-600 mb-6 max-w-sm mx-auto">
        {error?.message || "An unexpected error occurred"}
      </p>
    </div>
  );
}

export default function GlobalCatalogPage() {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  useAuthGuard();
  const businessId = useEffectiveBusinessId();

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

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedIndustryCategories, setSelectedIndustryCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [globalPage, setGlobalPage] = useState(1);
  const [globalViewMode, setGlobalViewMode] = useState<ViewMode>("grid");
  const [activatingProduct, setActivatingProduct] = useState<GlobalProduct | null>(null);

  const { data: globalProductsData, isLoading: isLoadingGlobal, error: globalProductsError } =
    useGlobalCatalog(businessId, {
      search: globalSearchQuery || undefined,
      industryCategoryIds:
        selectedIndustryCategories.length > 0
          ? selectedIndustryCategories.join(",")
          : undefined,
      brand: selectedBrand === "all" ? undefined : selectedBrand,
      page: globalPage,
      limit: globalPageSize,
    });

  const { data: industryCategoriesData } = useIndustryCategories();
  const { data: categoriesData } = useCategories(businessId);

  const globalProducts = (globalProductsData?.items ?? []) as GlobalProduct[];
  const globalMeta = globalProductsData?.meta;
  const industryCategories = Array.isArray(industryCategoriesData) ? industryCategoriesData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const activateGlobal = useActivateCatalogProduct(businessId);

  const handleActivateGlobal = (
    data: ActivateCatalogProductDto,
    branchActivations?: BranchActivation[]
  ) => {
    activateGlobal.mutate(data, {
      onSuccess: async (created) => {
        if (branchActivations?.length && businessId) {
          try {
            const localVariants = await getVariants(businessId, created.id);
            await Promise.allSettled(
              branchActivations.flatMap(({ branchId, variants: variantConfigs }) =>
                variantConfigs.flatMap((vc) => {
                  const match = localVariants.find((v) => v.variantLabel === vc.variantLabel);
                  if (!match) return [];
                  return [
                    activateProduct(businessId, branchId, match.id, {
                      isAvailable: true,
                      priceOverride: vc.priceOverride,
                    }),
                  ];
                })
              )
            );
          } catch {
            // Non-critical: catalog product was activated, branch activation failed silently
          }
        }
        setActivatingProduct(null);
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("globalCatalog.title")}
            </h1>
            <p className="text-slate-500 mt-1">{t("globalCatalog.subtitle")}</p>
          </div>
          <GlobalCatalogFilters
            searchQuery={globalSearchQuery}
            onSearchChange={(value) => {
              setGlobalSearchQuery(value);
              setGlobalPage(1);
            }}
            industryCategories={industryCategories}
            selectedIndustryCategories={selectedIndustryCategories}
            onIndustryCategoriesChange={(values) => {
              setSelectedIndustryCategories(values);
              setGlobalPage(1);
            }}
            brands={Array.from(
              new Set(globalProducts.map((p) => p.brand).filter((b): b is string => !!b))
            )}
            selectedBrand={selectedBrand}
            onBrandChange={(value) => {
              setSelectedBrand(value);
              setGlobalPage(1);
            }}
            viewMode={globalViewMode}
            onViewModeChange={(mode) => setGlobalViewMode(mode)}
          />
        </div>

        {isLoadingGlobal ? (
          <GlobalCatalogLoading />
        ) : globalProductsError ? (
          <ErrorState error={globalProductsError as Error} />
        ) : globalProducts.length === 0 ? (
          <EmptyGlobalCatalogState />
        ) : globalViewMode === "list" ? (
          <div className="space-y-3">
            {globalProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 bg-white/40 backdrop-blur-xl border border-white/80 rounded-card hover:shadow-sm transition-shadow"
              >
                <div className="w-16 h-16 rounded-card shrink-0 bg-slate-100 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">{product.name}</h4>
                  <p className="text-sm text-slate-500">
                    {product.brand || "Sin marca"} • {product.sku}
                    {product.variants && product.variants.length > 1 && (
                      <span className="ml-2 text-indigo-600">
                        {product.variants.length} variantes
                      </span>
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActivatingProduct(product)}>
                  <Store className="w-4 h-4 mr-2" />
                  {t("globalCatalog.activate")}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {globalProducts.map((product) => (
              <GlobalProductCard
                key={product.id}
                product={product}
                onActivate={setActivatingProduct}
              />
            ))}
          </div>
        )}

        {globalMeta && globalMeta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalPage((prev) => Math.max(1, prev - 1))}
              disabled={globalPage === 1}
            >
              {tc("pagination.previous")}
            </Button>
            <span className="text-sm text-slate-500">
              {tc("pagination.pageOf", { page: globalPage, totalPages: globalMeta.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalPage((prev) => Math.min(globalMeta.totalPages, prev + 1))}
              disabled={globalPage === globalMeta.totalPages}
            >
              {tc("pagination.next")}
            </Button>
          </div>
        )}
      </div>

      <ActivateProductDrawer
        product={activatingProduct}
        categories={categories}
        isOpen={!!activatingProduct}
        onClose={() => setActivatingProduct(null)}
        onActivate={handleActivateGlobal}
        isLoading={activateGlobal.isPending}
      />
    </DashboardLayout>
  );
}
