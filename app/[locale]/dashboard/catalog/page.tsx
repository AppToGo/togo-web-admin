"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Package,
  LayoutGrid,
  List,
  Filter,
  Store,
  Grid3X3,
  Tags,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useGlobalCatalog,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductStatus,
  useActivateGlobalProduct,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/features/catalog/hooks";
import {
  ProductCard,
  GlobalProductCard,
  ProductForm,
  ActivateProductModal,
  CategoryList,
} from "@/features/catalog/components";
import type {
  BusinessProduct,
  GlobalProduct,
  CreateCustomProductDto,
  UpdateProductDto,
  ActivateGlobalProductDto,
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
            <Skeleton className="w-16 h-16 rounded-card flex-shrink-0" />
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

function GlobalCatalogLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-card-lg overflow-hidden border border-slate-100"
        >
          <Skeleton className="aspect-[4/3]" />
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

// ============================================================================
// EMPTY STATES
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

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CatalogPage() {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  
  useAuthGuard();
  const router = useRouter();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const businessId = useEffectiveBusinessId() || "biz1"; // Default for mock

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BusinessProduct | null>(null);
  const [activatingProduct, setActivatingProduct] = useState<GlobalProduct | null>(null);

  // Data fetching
  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    error: productsError,
  } = useMyProducts(
    businessId,
    {
      search: searchQuery || undefined,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
    }
  );

  const { 
    data: globalProductsData, 
    isLoading: isLoadingGlobal,
    error: globalProductsError,
  } = useGlobalCatalog(businessId, {
    search: searchQuery || undefined,
  });

  const { 
    data: categoriesData, 
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useCategories(businessId);

  // Ensure data is always an array (handles API errors and unexpected responses)
  const products = Array.isArray(productsData) ? productsData : [];
  const globalProducts = Array.isArray(globalProductsData) ? globalProductsData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Mutations
  const createProduct = useCreateProduct(businessId);
  const updateProduct = useUpdateProduct(businessId);
  const deleteProduct = useDeleteProduct(businessId);
  const toggleStatus = useToggleProductStatus(businessId);
  const activateGlobal = useActivateGlobalProduct(businessId);
  const createCategory = useCreateCategory(businessId);
  const updateCategory = useUpdateCategory(businessId);
  const deleteCategory = useDeleteCategory(businessId);

  // Handlers
  const handleCreateProduct = (data: CreateCustomProductDto | UpdateProductDto) => {
    createProduct.mutate(data as CreateCustomProductDto, {
      onSuccess: () => setIsCreateModalOpen(false),
    });
  };

  const handleUpdateProduct = (data: CreateCustomProductDto | UpdateProductDto) => {
    if (!editingProduct) return;
    updateProduct.mutate(
      { productId: editingProduct.id, data: data as UpdateProductDto },
      { onSuccess: () => setEditingProduct(null) }
    );
  };

  const handleActivateGlobal = (data: ActivateGlobalProductDto) => {
    activateGlobal.mutate(data, {
      onSuccess: () => setActivatingProduct(null),
    });
  };

  // Check if user has access
  if (!hasBusiness && !isSuperAdmin) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("products.create")}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="my-products" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="my-products" className="gap-2">
              <Package className="w-4 h-4" />
              {t("tabs.products")}
              {products.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                  {products.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="global-catalog" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              {t("globalCatalog.title")}
              {globalProducts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                  {globalProducts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="w-4 h-4" />
              {t("tabs.categories")}
            </TabsTrigger>
          </TabsList>

          {/* Mis Productos Tab */}
          <TabsContent value="my-products" className="space-y-4">
            {/* Filters */}
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
              <div className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t("products.error.title") || "Error loading products"}
                </h3>
                <p className="text-sm text-red-600 mb-6 max-w-sm mx-auto">
                  {productsError instanceof Error ? productsError.message : "An unexpected error occurred"}
                </p>
              </div>
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
          </TabsContent>

          {/* Catálogo TOGO Tab */}
          <TabsContent value="global-catalog" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t("globalCatalog.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Global Products Grid */}
            {isLoadingGlobal ? (
              <GlobalCatalogLoading />
            ) : globalProductsError ? (
              <div className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Grid3X3 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t("globalCatalog.error.title") || "Error loading catalog"}
                </h3>
                <p className="text-sm text-red-600 mb-6 max-w-sm mx-auto">
                  {globalProductsError instanceof Error ? globalProductsError.message : "An unexpected error occurred"}
                </p>
              </div>
            ) : globalProducts.length === 0 ? (
              <EmptyGlobalCatalogState />
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
          </TabsContent>

          {/* Categorías Tab */}
          <TabsContent value="categories">
            {isLoadingCategories ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-card-lg" />
                ))}
              </div>
            ) : categoriesError ? (
              <div className="text-center py-16 bg-red-50 rounded-card-lg border border-red-200">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Tags className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t("categories.error.title") || "Error loading categories"}
                </h3>
                <p className="text-sm text-red-600 mb-6 max-w-sm mx-auto">
                  {categoriesError instanceof Error ? categoriesError.message : "An unexpected error occurred"}
                </p>
              </div>
            ) : (
              <CategoryList
                categories={categories}
                onCreate={(data) =>
                  createCategory.mutate({
                    name: data.name,
                    color: data.color,
                  })
                }
                onUpdate={(id, data) =>
                  updateCategory.mutate({
                    categoryId: id,
                    data: { name: data.name, color: data.color },
                  })
                }
                onDelete={(id) => deleteCategory.mutate(id)}
                isLoading={
                  createCategory.isPending ||
                  updateCategory.isPending ||
                  deleteCategory.isPending
                }
              />
            )}
          </TabsContent>
        </Tabs>
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

      {/* Activate Global Product Modal */}
      <ActivateProductModal
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
