"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useCreateGlobalProduct,
  useIndustries,
  useIndustryCategories,
  useAdminCatalogTranslations,
} from "@/features/admin/catalog/hooks";
import { GlobalProductForm } from "@/features/admin/catalog/components";
import type { CreateGlobalProductDto, UpdateGlobalProductDto } from "@/features/admin/catalog/types";
import { useState } from "react";

// ============================================================================
// COMPONENT
// ============================================================================

export default function CreateGlobalProductPage() {
  useAuthGuard();
  const router = useRouter();
  const isSuperAdmin = useIsSuperAdmin();
  const { admin, common, catalog } = useAdminCatalogTranslations();

  // Form state for industry selection
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>("");

  // Data fetching
  const { data: industries = [], isLoading: isLoadingIndustries } = useIndustries();
  const { data: industryCategories = [], isLoading: isLoadingCategories } =
    useIndustryCategories(selectedIndustryId);

  // Mutation
  const createProduct = useCreateGlobalProduct();

  // Update selected industry when form changes
  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustryId(industryId);
  };

  // Handle form submission
  const handleSubmit = (data: CreateGlobalProductDto | UpdateGlobalProductDto) => {
    createProduct.mutate(data as CreateGlobalProductDto, {
      onSuccess: () => {
        router.push("/admin/global-products");
      },
    });
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/admin/global-products");
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {admin('newGlobalProduct')}
            </h1>
            <p className="text-slate-500">
              {admin('createProductDescription')}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{admin('productInformation')}</CardTitle>
            <CardDescription>
              {admin('productDetailsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingIndustries ? (
              <div className="space-y-4">
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-32 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : (
              <GlobalProductForm
                industries={industries}
                industryCategories={industryCategories}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={createProduct.isPending}
              />
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="max-w-3xl bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">{admin('tips')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>{catalog('products.sku')}:</strong> {admin('skuTip')}
            </p>
            <p>
              <strong>{admin('industry')}:</strong> {admin('industryTip')}
            </p>
            <p>
              <strong>{catalog('products.image')}:</strong> {admin('imageTip')}
            </p>
            <p>
              <strong>{admin('attributes')}:</strong> {admin('attributesTip')}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
