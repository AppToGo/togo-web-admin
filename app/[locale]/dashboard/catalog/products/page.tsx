"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Package, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useMyProducts,
  useProductsWithBranchFilter,
  useBulkBranchUpdate,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/features/catalog/hooks";
import {
  ProductCard,
  ProductForm,
  ProductFilters,
  BulkActionBar,
} from "@/features/catalog/components";
import { useBranches } from "@/features/branches/hooks/useBranches";
import { toast } from "sonner";
import type {
  BusinessProduct,
  CreateCustomProductDto,
  UpdateProductDto,
} from "@/features/catalog/types";

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
            className="flex items-center gap-4 p-4 bg-white rounded-card border border-slate-100"
          >
            <Skeleton className="w-5 h-5 rounded shrink-0" />
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
        <div
          key={i}
          className="bg-white rounded-card-lg p-4 border border-slate-100"
        >
          <Skeleton className="aspect-square rounded-card mb-4" />
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
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  return (
    <div className="text-center py-16 bg-slate-50 rounded-card-lg border border-dashed border-slate-200">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <Package className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {t("products.empty.title")}
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
        {t("products.empty.message")}
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={onCreate} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          {tc("buttons.create")}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ error }: { error: Error | null }) {
  const t = useTranslations("catalog");

  return (
    <div className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <Package className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        {t("products.error.title")}
      </h3>
      <p className="text-sm text-red-600 mb-6 max-w-sm mx-auto">
        {error?.message || "An unexpected error occurred"}
      </p>
    </div>
  );
}

// ============================================================================
// PRODUCT CARD WITH SELECTION WRAPPER
// ============================================================================

interface SelectableProductCardProps {
  product: BusinessProduct;
  viewMode: ViewMode;
  isSelected: boolean;
  showCheckbox: boolean;
  branchActivationStatus?: {
    isAvailable: boolean;
    stock: number;
  } | null;
  onToggleSelection: (id: string) => void;
  onEdit: (product: BusinessProduct) => void;
  onDelete: (product: BusinessProduct) => void;
}

function SelectableProductCard({
  product,
  viewMode,
  isSelected,
  showCheckbox,
  branchActivationStatus,
  onToggleSelection,
  onEdit,
  onDelete,
}: SelectableProductCardProps) {
  const t = useTranslations("catalog");

  const handleCheckboxChange = useCallback(() => {
    onToggleSelection(product.id);
  }, [onToggleSelection, product.id]);

  const cardContent = (
    <ProductCard
      product={product}
      viewMode={viewMode}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 transition-all duration-200",
          isSelected
            ? "border-indigo-500 bg-indigo-50/30"
            : "border-slate-100 hover:border-slate-200"
        )}
      >
        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className="shrink-0"
            aria-label={t("products.select")}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">{cardContent}</div>
        </div>
        {branchActivationStatus && (
          <Badge
            variant={
              branchActivationStatus.isAvailable ? "default" : "secondary"
            }
            className={cn(
              "shrink-0",
              branchActivationStatus.isAvailable
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-100"
            )}
          >
            {branchActivationStatus.isAvailable
              ? t("products.status.activeInBranch")
              : t("products.status.inactiveInBranch")}
          </Badge>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500/20"
          : "border-slate-100 hover:border-slate-200"
      )}
    >
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className="bg-white/90 backdrop-blur-sm"
            aria-label={t("products.select")}
          />
        </div>
      )}
      {branchActivationStatus && (
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant={
              branchActivationStatus.isAvailable ? "default" : "secondary"
            }
            className={cn(
              branchActivationStatus.isAvailable
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-100"
            )}
          >
            {branchActivationStatus.isAvailable
              ? t("products.status.activeInBranch")
              : t("products.status.inactiveInBranch")}
          </Badge>
        </div>
      )}
      {cardContent}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ProductsPage() {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  useAuthGuard();
  const businessId = useEffectiveBusinessId();

  // Estados existentes
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");



  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BusinessProduct | null>(
    null
  );

  // Nuevos estados para funcionalidad HYBRID
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // NUEVO: Estado de activation filter como objeto booleano
  const [activationFilter, setActivationFilter] = useState<{
    activated: boolean;
    notActivated: boolean;
  }>({
    activated: true,
    notActivated: true,
  });

  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Calcular conteo de filtros activos
  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedBranchId &&
      !(activationFilter.activated && activationFilter.notActivated),
  ].filter(Boolean).length;

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSelectedCategory("all");
    setActivationFilter({ activated: true, notActivated: true });
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedBranchId,
    activationFilter,
  ]);

  // Reset selection when branch changes
  useEffect(() => {
    setSelectedProductIds(new Set());
  }, [selectedBranchId]);

  // Hooks de datos
  const { data: branchesData } = useBranches();
  const { data: categoriesData } = useCategories(businessId || "");

  // Lógica condicional: usar useProductsWithBranchFilter cuando hay sede seleccionada
  const shouldUseBranchFilter = !!selectedBranchId;

  // Helper para convertir activationFilter a string para queries
  const getActivationStatusFromFilter = useCallback(():
    | "activated"
    | "not_activated"
    | "all" => {
    if (activationFilter.activated && !activationFilter.notActivated)
      return "activated";
    if (!activationFilter.activated && activationFilter.notActivated)
      return "not_activated";
    return "all";
  }, [activationFilter]);

  const myProductsQuery = useMyProducts(
    !shouldUseBranchFilter ? businessId || "" : "",
    {
      search: searchQuery || undefined,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      isActive: true,
      page,
      limit: pageSize,
    }
  );

  const branchFilteredQuery = useProductsWithBranchFilter(
    shouldUseBranchFilter ? businessId || "" : "",
    {
      search: searchQuery || undefined,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      isActive: true,
      branchId: selectedBranchId || undefined,
      activationStatus: getActivationStatusFromFilter(),
      page,
      limit: pageSize,
    }
  );

  // Usar el query apropiado según el contexto
  const productsData = shouldUseBranchFilter
    ? branchFilteredQuery.data
    : myProductsQuery.data;
  const isLoadingProducts = shouldUseBranchFilter
    ? branchFilteredQuery.isLoading
    : myProductsQuery.isLoading;
  const productsError = shouldUseBranchFilter
    ? branchFilteredQuery.error
    : myProductsQuery.error;

  // Handle backend response format: { items, limit, page, total }
  const products = productsData?.items || [];
  const branches = branchesData || [];
  const total = productsData?.total || 0;
  const currentPage = productsData?.page || 1;
  const limit = productsData?.limit || pageSize;

  // Calculate totalPages locally since backend doesn't send it
  const totalPages = Math.ceil(total / limit);

  // Build meta object to match expected format
  const meta =
    total > 0
      ? {
          total,
          page: currentPage,
          limit,
          totalPages,
        }
      : undefined;

  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Mutaciones
  const createProduct = useCreateProduct(businessId || "");
  const updateProduct = useUpdateProduct(businessId || "");
  const deleteProduct = useDeleteProduct(businessId || "");
  const bulkBranchUpdate = useBulkBranchUpdate(businessId || "");

  // Handlers para selección múltiple
  const toggleProductSelection = useCallback((id: string) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllProducts = useCallback(() => {
    const allIds = products.map((p) => p.id);
    setSelectedProductIds(new Set(allIds));
  }, [products]);

  const clearSelection = useCallback(() => {
    setSelectedProductIds(new Set());
  }, []);

  // Handlers para bulk actions
  const handleBulkActivate = useCallback(async () => {
    if (!selectedBranchId || selectedProductIds.size === 0) return;

    try {
      await bulkBranchUpdate.mutateAsync({
        branchId: selectedBranchId!,
        productIds: Array.from(selectedProductIds),
        isAvailable: true,
      });
      clearSelection();
    } catch {
      // Error ya manejado por el hook
    }
  }, [
    selectedBranchId,
    selectedProductIds,
    bulkBranchUpdate,
    t,
    clearSelection,
  ]);

  const handleBulkDeactivate = useCallback(async () => {
    if (!selectedBranchId || selectedProductIds.size === 0) return;

    try {
      await bulkBranchUpdate.mutateAsync({
        branchId: selectedBranchId!,
        productIds: Array.from(selectedProductIds),
        isAvailable: false,
      });
      clearSelection();
    } catch {
      // Error ya manejado por el hook
    }
  }, [
    selectedBranchId,
    selectedProductIds,
    bulkBranchUpdate,
    t,
    clearSelection,
  ]);

  const handleBulkAdjustStock = useCallback(() => {
    if (selectedProductIds.size === 0) return;
    setIsBulkStockModalOpen(true);
  }, [selectedProductIds.size]);

  // Handlers existentes
  const handleCreateProduct = (
    data: CreateCustomProductDto | UpdateProductDto
  ) => {
    createProduct.mutate(data as CreateCustomProductDto, {
      onSuccess: () => setIsCreateModalOpen(false),
    });
  };

  const handleUpdateProduct = (
    data: CreateCustomProductDto | UpdateProductDto
  ) => {
    if (!editingProduct) return;
    updateProduct.mutate(
      { productId: editingProduct.id, data: data as UpdateProductDto },
      { onSuccess: () => setEditingProduct(null) }
    );
  };

  // Memoized branch activation status map
  const branchActivationMap = useMemo(() => {
    if (!shouldUseBranchFilter || !productsData?.items) return new Map();

    const map = new Map<string, { isAvailable: boolean; stock: number }>();
    productsData.items.forEach(
      (
        product: BusinessProduct & {
          branchAvailability?: { isAvailable: boolean; stock: number };
        }
      ) => {
        if (product.branchAvailability) {
          map.set(product.id, product.branchAvailability);
        }
      }
    );
    return map;
  }, [shouldUseBranchFilter, productsData]);

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

  const hasSelection = selectedProductIds.size > 0;
  const showCheckboxes = !!selectedBranchId;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("tabs.products")}
            </h1>
            <p className="text-slate-500 mt-1">{t("subtitle")}</p>
          </div>

          {/* Filtros usando ProductFilters component */}
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBranchId={selectedBranchId}
            onBranchChange={setSelectedBranchId}
            activationFilter={activationFilter}
            onActivationFilterChange={setActivationFilter}
            categories={categories}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearAllFilters}
            viewMode={viewMode}
            onViewModeChange={(value) => setViewMode(value as ViewMode)}
          />
        </div>

        <div className="flex flex-row justify-between items-end gap-4">
          {/* Select All / Clear Selection Actions */}
          {showCheckboxes && products.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedProductIds.size === products.length &&
                      products.length > 0
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllProducts();
                      } else {
                        clearSelection();
                      }
                    }}
                    aria-label={t("products.selectAll")}
                  />
                  <span className="text-sm text-slate-600">
                    {selectedProductIds.size > 0
                      ? t("products.selectedCount", {
                          count: selectedProductIds.size,
                        })
                      : t("products.selectAll")}
                  </span>
                </div>
                {hasSelection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-slate-500"
                  >
                    {tc("buttons.clear")}
                  </Button>
                )}
              </div>
            </div>
          )}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("products.create")}
          </Button>
        </div>

        {/* Products Content */}
        {isLoadingProducts ? (
          <ProductsLoading viewMode={viewMode} />
        ) : productsError ? (
          <ErrorState error={productsError as Error} />
        ) : products.length === 0 ? (
          <EmptyProductsState onCreate={() => setIsCreateModalOpen(true)} />
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            )}
          >
            {products.map((product) => (
              <SelectableProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                isSelected={selectedProductIds.has(product.id)}
                showCheckbox={showCheckboxes}
                branchActivationStatus={
                  branchActivationMap.get(product.id) || null
                }
                onToggleSelection={toggleProductSelection}
                onEdit={setEditingProduct}
                onDelete={(p) => deleteProduct.mutate(p.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              {tc("pagination.previous")}
            </Button>
            <span className="text-sm text-slate-500">
              {tc("pagination.pageOf", { page, totalPages: meta.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((prev) => Math.min(meta.totalPages, prev + 1))
              }
              disabled={page >= meta.totalPages}
            >
              {tc("pagination.next")}
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedProductIds.size}
        branchId={selectedBranchId}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onAdjustStock={handleBulkAdjustStock}
        onClear={clearSelection}
        isLoading={bulkBranchUpdate.isPending}
      />

      {/* Create Product Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("products.create")}</DialogTitle>
            <DialogDescription>
              {t("products.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            branches={branches}
            onSubmit={handleCreateProduct}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={() => setEditingProduct(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("products.edit")}</DialogTitle>
            <DialogDescription>
              {t("products.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSubmit={handleUpdateProduct}
            onCancel={() => setEditingProduct(null)}
            isLoading={updateProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Stock Adjustment Modal (Placeholder) */}
      <Dialog
        open={isBulkStockModalOpen}
        onOpenChange={setIsBulkStockModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("bulkActions.adjustStock")}</DialogTitle>
            <DialogDescription>
              {t("bulkActions.adjustStockDescription", {
                count: selectedProductIds.size,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              {t("bulkActions.comingSoon")}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkStockModalOpen(false)}
            >
              {tc("buttons.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
