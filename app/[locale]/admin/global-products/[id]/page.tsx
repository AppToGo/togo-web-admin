"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useAdminCatalogTranslations } from "@/features/admin/catalog/hooks";
import { ArrowLeft, Package, Store, AlertCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useGlobalProduct,
  useUpdateGlobalProduct,
  useIndustries,
  useGlobalProductStats,
} from "@/features/admin/catalog/hooks";
import { useIndustryCategories } from "@/features/admin/industry-categories/hooks";
import { GlobalProductForm } from "@/features/admin/catalog/components";
import type { UpdateGlobalProductDto } from "@/features/admin/catalog/types";

// ============================================================================
// COMPONENT
// ============================================================================

export default function EditGlobalProductPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const isSuperAdmin = useIsSuperAdmin();
  const { admin, common, catalog } = useAdminCatalogTranslations();
  const productId = params.id as string;

  // Form state for industry selection
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>("");

  // Data fetching
  const { data: product, isLoading: isLoadingProduct } = useGlobalProduct(productId);
  const { data: stats, isLoading: isLoadingStats } = useGlobalProductStats(productId);
  const { data: industries = [] } = useIndustries();
  const { data: industryCategories = [] } = useIndustryCategories({
    industryIds: selectedIndustryId || product?.industryId ? [selectedIndustryId || product?.industryId || ""] : undefined,
  });

  // Update selected industry when form changes
  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustryId(industryId);
  };

  // Mutation
  const updateProduct = useUpdateGlobalProduct();

  // Handle form submission
  const handleSubmit = (data: UpdateGlobalProductDto) => {
    updateProduct.mutate({ id: productId, data });
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/admin/global-products");
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return common("notApplicable");
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check access
  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {common('errors.accessDenied')}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {admin('superAdminOnly')}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Loading state
  if (isLoadingProduct) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {admin('productNotFound')}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {admin('productNotFoundDescription')}
          </p>
          <Button onClick={() => router.push("/admin/global-products")}>
            {admin('backToCatalog')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const activationCount = product._count?.businessProducts || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <Badge
                variant={product.isActive ? "default" : "secondary"}
                className={cn(
                  product.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                )}
              >
                {product.isActive ? common("status.active") : common("status.inactive")}
              </Badge>
            </div>
            <p className="text-slate-500 font-mono text-sm">{product.sku}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{catalog('products.edit')}</CardTitle>
                <CardDescription>
                  {admin('editProductDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GlobalProductForm
                  product={product}
                  industries={industries}
                  industryCategories={industryCategories}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  onIndustryChange={handleIndustryChange}
                  isLoading={updateProduct.isPending}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Stats & Info */}
          <div className="space-y-6">
            {/* Usage Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  {admin('usageInBusinesses')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStats ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold text-slate-900">
                        {stats?.totalActivations || 0}
                      </p>
                      <p className="text-sm text-slate-500">
                        {stats?.totalActivations === 1 
                          ? admin('businessesActivatedOne') 
                          : admin('businessesActivated', { count: stats?.totalActivations || 0 })}
                      </p>
                    </div>

                    {activationCount > 0 && (
                      <>
                        <Separator />
                        
                        {/* By Industry */}
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">
                            {admin('mainlyIn')}
                          </p>
                          <div className="space-y-2">
                            {stats?.byIndustry && Object.entries(stats.byIndustry)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .slice(0, 3)
                              .map(([industry, count]) => (
                                <div key={industry} className="flex items-center justify-between">
                                  <span className="text-sm text-slate-600">{industry}</span>
                                  <span className="text-sm font-medium text-slate-900">
                                    {count as number}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Warning Card */}
            {activationCount > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>{common('warning')}:</strong> {admin('warningChangesAffectAll', { count: activationCount })}
                </AlertDescription>
              </Alert>
            )}

            {/* Audit Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {admin('auditInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{common("fields.created")}:</span>
                  <span className="text-slate-700">{formatDate(product.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{common("fields.lastUpdated")}:</span>
                  <span className="text-slate-700">{formatDate(product.updatedAt)}</span>
                </div>
                {product.createdBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{common("fields.createdBy")}:</span>
                    <span className="text-slate-700">{product.createdBy}</span>
                  </div>
                )}
                {product.updatedBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{common("fields.updatedBy")}:</span>
                    <span className="text-slate-700">{product.updatedBy}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Preview */}
            {product.image && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{common("preview")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(common("status.noImage"))}`;
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
