"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  Upload,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useGlobalProducts,
  useGlobalCatalogStats,
  useIndustries,
  useDeleteGlobalProduct,
  useToggleGlobalProductStatus,
  useIndustryCategories,
} from "@/features/admin/catalog/hooks";
import {
  AdminGlobalProductCard,
  GlobalCatalogStatsCards,
  DeleteProductDialog,
} from "@/features/admin/catalog/components";
import type {
  GlobalProduct,
  GlobalProductFilters,
} from "@/features/admin/catalog/types";

type ViewMode = "grid" | "list";

// ============================================================================
// LOADING SKELETONS
// ============================================================================

function ProductsLoading({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100"
          >
            <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
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
        <div
          key={i}
          className="bg-white rounded-xl p-4 border border-slate-100"
        >
          <Skeleton className="aspect-[4/3] rounded-lg mb-4" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyProductsState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations();
  
  return (
    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <Filter className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {t("adminCatalog.empty.noProductsFound")}
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
        {t("adminCatalog.empty.adjustFilters")}
      </p>
      <Button onClick={onCreate}>
        <Plus className="w-4 h-4 mr-2" />
        {t("catalog.products.create")}
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function GlobalProductsPage() {
  useAuthGuard();
  const router = useRouter();
  const isSuperAdmin = useIsSuperAdmin();
  const t = useTranslations();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<GlobalProductFilters>({
    page: 1,
    limit: 20,
  });

  // Modal states
  const [deletingProduct, setDeletingProduct] = useState<GlobalProduct | null>(null);

  // Data fetching
  const { data: productsData, isLoading: isLoadingProducts } = useGlobalProducts(filters);
  const { data: stats, isLoading: isLoadingStats } = useGlobalCatalogStats();
  const { data: industries = [] } = useIndustries();
  const { data: industryCategories = [] } = useIndustryCategories(
    deletingProduct?.industryId || ""
  );

  // Mutations
  const deleteProduct = useDeleteGlobalProduct();
  const toggleStatus = useToggleGlobalProductStatus();

  // Filter handlers
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleIndustryChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      industryId: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      isActive: value === "all" ? undefined : value === "active",
      page: 1,
    }));
  };

  const handleBrandChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      brand: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  // Action handlers
  const handleEdit = (product: GlobalProduct) => {
    router.push(`/admin/global-products/${product.id}`);
  };

  const handleDelete = (product: GlobalProduct) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => setDeletingProduct(null),
    });
  };

  const handleToggleStatus = (product: GlobalProduct, isActive: boolean) => {
    toggleStatus.mutate({ id: product.id, isActive });
  };

  const handleCreate = () => {
    router.push("/admin/global-products/create");
  };

  const handleImport = () => {
    router.push("/admin/global-products/import");
  };

  // Get unique brands for filter
  const brands = stats?.topBrands.map((b) => b.brand) || [];

  // Check access
  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Filter className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("common.errors.accessDenied")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("adminCatalog.superAdminOnly")}
          </p>
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
            <h1 className="text-2xl font-bold text-slate-900">
              {t("adminCatalog.title")}
            </h1>
            <p className="text-slate-500 mt-1">
              {t("adminCatalog.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              {t("common.buttons.import")}
            </Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              {t("adminCatalog.newProduct")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <GlobalCatalogStatsCards stats={stats} isLoading={isLoadingStats} />

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("adminCatalog.searchPlaceholder")}
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Industry Filter */}
          <Select
            value={filters.industryId || "all"}
            onValueChange={handleIndustryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("adminCatalog.allIndustries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("adminCatalog.allIndustries")}</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Brand Filter */}
          <Select
            value={filters.brand || "all"}
            onValueChange={handleBrandChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("adminCatalog.allBrands")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("adminCatalog.allBrands")}</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={
              filters.isActive === undefined
                ? "all"
                : filters.isActive
                ? "active"
                : "inactive"
            }
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("common.fields.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.filters.all")}</SelectItem>
              <SelectItem value="active">{t("common.status.active")}</SelectItem>
              <SelectItem value="inactive">{t("common.status.inactive")}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "list"
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        {!isLoadingProducts && productsData && (
          <p className="text-sm text-slate-500">
            {t("common.pagination.showingOf", { 
              count: productsData.data.length, 
              total: productsData.meta.total 
            })}
          </p>
        )}

        {/* Products Grid/List */}
        {isLoadingProducts ? (
          <ProductsLoading viewMode={viewMode} />
        ) : productsData?.data.length === 0 ? (
          <EmptyProductsState onCreate={handleCreate} />
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            )}
          >
            {productsData?.data.map((product) => (
              <AdminGlobalProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {productsData && productsData.meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page || 1) - 1),
                }))
              }
              disabled={filters.page === 1}
            >
              {t("common.pagination.previous")}
            </Button>
            <span className="text-sm text-slate-500">
              {t("common.pagination.pageOf", { 
                page: filters.page ?? 1, 
                totalPages: productsData.meta.totalPages 
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(
                    productsData.meta.totalPages,
                    (prev.page || 1) + 1
                  ),
                }))
              }
              disabled={filters.page === productsData.meta.totalPages}
            >
              {t("common.pagination.next")}
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        product={deletingProduct}
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={confirmDelete}
        isLoading={deleteProduct.isPending}
      />
    </DashboardLayout>
  );
}
