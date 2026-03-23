"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Package, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";
import {
  useMyProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductStatus,
} from "@/features/catalog/hooks";
import { ProductCard, ProductForm } from "@/features/catalog/components";
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
// MAIN PAGE COMPONENT
// ============================================================================

export default function ProductsPage() {
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

  // Estados
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BusinessProduct | null>(
    null
  );

  // Hooks
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useMyProducts(businessId, {
    search: searchQuery || undefined,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    isActive:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
  });

  const { data: categoriesData } = useCategories(businessId);

  const products = Array.isArray(productsData) ? productsData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Mutaciones
  const createProduct = useCreateProduct(businessId);
  const updateProduct = useUpdateProduct(businessId);
  const deleteProduct = useDeleteProduct(businessId);
  const toggleStatus = useToggleProductStatus(businessId);

  // Handlers
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

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("products.create")}
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("products.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("products.filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("products.filters.all")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={tc("status.active")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("products.filters.all")}</SelectItem>
              <SelectItem value="active">{tc("status.active")}</SelectItem>
              <SelectItem value="inactive">{tc("status.inactive")}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <ViewToggle
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            variant="bordered"
          />
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
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onEdit={setEditingProduct}
                onDelete={(p) => deleteProduct.mutate(p.id)}
                onToggleStatus={(p, isActive) =>
                  toggleStatus.mutate({ productId: p.id, isActive })
                }
              />
            ))}
          </div>
        )}
      </div>

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
    </DashboardLayout>
  );
}
