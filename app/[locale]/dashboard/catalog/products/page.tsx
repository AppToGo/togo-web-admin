"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Package, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCatalogProducts,
  useCreateCatalogProduct,
  useUpdateCatalogProduct,
  useDeleteCatalogProduct,
  useCategories,
} from "@/features/catalog/hooks";
import {
  ProductCard,
  ProductForm,
  ProductFilters,
} from "@/features/catalog/components";
import type { SourceFilter } from "@/features/catalog/components/ProductFilters";
import type { BranchActivation } from "@/features/catalog/components/ProductForm";
import { activateProduct } from "@/features/branch-inventory/services/branch-inventory.service";
import { getVariants } from "@/features/catalog/services/catalog.service";
import { useCurrentBusiness } from "@/features/business/hooks/useBusiness";
import type {
  CatalogProduct,
  BusinessCategory,
  CreateProductDto,
  UpdateCatalogProductDto,
} from "@/features/catalog/types";

type ViewMode = "grid" | "list";

function ProductsLoading({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-card border border-slate-100">
            <Skeleton className="w-16 h-16 rounded-card shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-card-lg p-4 border border-slate-100">
          <Skeleton className="aspect-square rounded-card mb-4" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyProductsState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  return (
    <div className="text-center py-16 bg-slate-50 rounded-card-lg border border-dashed border-slate-200">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <Package className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("products.empty.title")}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{t("products.empty.message")}</p>
      <div className="flex justify-center gap-3">
        <Button onClick={onCreate} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          {tc("buttons.create")}
        </Button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  useAuthGuard();
  const businessId = useEffectiveBusinessId();
  const { data: currentBusiness } = useCurrentBusiness();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>({ custom: true, catalog: true });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [editDefaultTab, setEditDefaultTab] = useState<"info" | "variants">("info");

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const showProductImages =
    (currentBusiness?.settings as Record<string, unknown> | undefined)?.useProductImages !== false;

  const activeFiltersCount = [
    selectedCategory !== "all",
    !sourceFilter.custom || !sourceFilter.catalog,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSourceFilter({ custom: true, catalog: true });
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, sourceFilter]);

  const { data: categoriesData } = useCategories(businessId ?? "");
  const categories: BusinessCategory[] = Array.isArray(categoriesData) ? categoriesData : [];

  const isFromTemplateFilter =
    sourceFilter.custom && !sourceFilter.catalog ? false :
    !sourceFilter.custom && sourceFilter.catalog ? true :
    undefined;

  const { data: productsData, isLoading, error } = useCatalogProducts(businessId ?? "", {
    search: searchQuery || undefined,
    page,
    limit: pageSize,
  });

  const products = productsData?.items ?? [];
  const total = productsData?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Build a category lookup map for name resolution in cards
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) map.set(cat.id, cat.name);
    return map;
  }, [categories]);

  const createProduct = useCreateCatalogProduct(businessId ?? "");
  const updateProduct = useUpdateCatalogProduct(businessId ?? "");
  const deleteProduct = useDeleteCatalogProduct(businessId ?? "");

  const handleCreateProduct = (
    data: CreateProductDto | UpdateCatalogProductDto,
    branchActivations?: BranchActivation[]
  ) => {
    createProduct.mutate(data as CreateProductDto, {
      onSuccess: async (created) => {
        if (branchActivations?.length && businessId) {
          try {
            const variants = await getVariants(businessId, created.id);
            await Promise.allSettled(
              branchActivations.flatMap(({ branchId, variants: variantConfigs }) =>
                variantConfigs
                  .filter((vc) => vc.isAvailable)
                  .flatMap((vc) => {
                    const match = variants.find(
                      (v) => v.variantLabel === vc.variantLabel
                    );
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
            // Non-critical: product was created, branch activation failed silently
          }
        }
        setIsCreateModalOpen(false);
        setEditingProduct(created);
        setEditDefaultTab("variants");
      },
    });
  };

  const handleUpdateProduct = useCallback(
    (data: CreateProductDto | UpdateCatalogProductDto, _branchActivations?: BranchActivation[]) => {
      if (!editingProduct) return;
      updateProduct.mutate(
        { productId: editingProduct.id, dto: data as UpdateCatalogProductDto },
        { onSuccess: () => setEditingProduct(null) }
      );
    },
    [editingProduct, updateProduct]
  );

  const openEdit = useCallback((product: CatalogProduct, tab: "info" | "variants" = "info") => {
    setEditingProduct(product);
    setEditDefaultTab(tab);
  }, []);

  if (!businessId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{t("noBusiness.title")}</h2>
          <p className="text-slate-500 text-center max-w-md">{t("noBusiness.description")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("tabs.products")}</h1>
            <p className="text-slate-500 mt-1">{t("subtitle")}</p>
          </div>

          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBranchId={null}
            onBranchChange={() => {}}
            activationFilter={{ activated: true, notActivated: true }}
            onActivationFilterChange={() => {}}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            categories={categories}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearAllFilters}
            viewMode={viewMode}
            onViewModeChange={(value) => setViewMode(value as ViewMode)}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            {t("products.create")}
          </Button>
        </div>

        {/* Products */}
        {isLoading ? (
          <ProductsLoading viewMode={viewMode} />
        ) : error ? (
          <div className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
            <p className="text-red-600 text-sm">{t("products.error.title")}</p>
          </div>
        ) : products.length === 0 ? (
          <EmptyProductsState onCreate={() => setIsCreateModalOpen(true)} />
        ) : (
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          )}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                showImage={showProductImages}
                categoryName={product.businessCategoryId ? categoryMap.get(product.businessCategoryId) : undefined}
                onEdit={(p) => openEdit(p, "info")}
                onDelete={(p) => deleteProduct.mutate(p.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              {tc("pagination.previous")}
            </Button>
            <span className="text-sm text-slate-500">
              {tc("pagination.pageOf", { page, totalPages })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              {tc("pagination.next")}
            </Button>
          </div>
        )}
      </div>

      {/* Create Drawer */}
      <Drawer
        open={isCreateModalOpen}
        onOpenChange={(open) => { if (!createProduct.isPending) setIsCreateModalOpen(open); }}
        isLoading={createProduct.isPending}
      >
        <DrawerContent size="md" data-testid="create-product-drawer">
          <DrawerHeader>
            <DrawerTitle>{t("products.create")}</DrawerTitle>
            <DrawerDescription>{t("products.createDescription")}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            <ProductForm
              formId="create-product-form"
              hideActions
              businessId={businessId}
              categories={categories}
              onSubmit={handleCreateProduct}
              onCancel={() => setIsCreateModalOpen(false)}
              isLoading={createProduct.isPending}
              showProductImages={showProductImages}
            />
          </div>
          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createProduct.isPending}
            >
              {tc("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              form="create-product-form"
              isLoading={createProduct.isPending}
              disabled={createProduct.isPending}
            >
              {t("products.create")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        open={!!editingProduct}
        onOpenChange={(open) => { if (!updateProduct.isPending && !open) setEditingProduct(null); }}
        isLoading={updateProduct.isPending}
      >
        <DrawerContent size="xl" data-testid="edit-product-drawer">
          <DrawerHeader>
            <DrawerTitle>{t("products.edit")}</DrawerTitle>
            <DrawerDescription>{editingProduct?.name}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            {editingProduct && (
              <ProductForm
                formId="edit-product-form"
                hideActions
                product={editingProduct}
                businessId={businessId}
                categories={categories}
                onSubmit={handleUpdateProduct}
                onCancel={() => setEditingProduct(null)}
                isLoading={updateProduct.isPending}
                showProductImages={showProductImages}
                defaultTab={editDefaultTab}
              />
            )}
          </div>
          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingProduct(null)}
              disabled={updateProduct.isPending}
            >
              {tc("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              form="edit-product-form"
              isLoading={updateProduct.isPending}
              disabled={updateProduct.isPending}
            >
              {tc("buttons.saveChanges")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </DashboardLayout>
  );
}
