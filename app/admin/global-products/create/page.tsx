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
} from "@/features/admin/catalog/hooks";
import { GlobalProductForm } from "@/features/admin/catalog/components";
import type { CreateGlobalProductDto, UpdateGlobalProductDto } from "@/features/admin/catalog/types";
import { useState, useEffect } from "react";

// ============================================================================
// COMPONENT
// ============================================================================

export default function CreateGlobalProductPage() {
  useAuthGuard();
  const router = useRouter();
  const isSuperAdmin = useIsSuperAdmin();

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
            Acceso denegado
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            Esta sección es solo para Super Administradores.
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
              Nuevo Producto Global
            </h1>
            <p className="text-slate-500">
              Crea un nuevo producto para el catálogo global de TOGO
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Ingresa los detalles del producto. El SKU debe ser único.
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
            <CardTitle className="text-base">Consejos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>SKU:</strong> Usa un código único que identifique claramente el producto.
              Ejemplo: COCA-COLA-350ML, LECHE-ENTERA-1L
            </p>
            <p>
              <strong>Industria:</strong> Selecciona la industria correcta para que los negocios
              puedan encontrar el producto fácilmente.
            </p>
            <p>
              <strong>Imagen:</strong> Usa imágenes de buena calidad con fondo blanco o transparente.
              Tamaño recomendado: 400x400 píxeles.
            </p>
            <p>
              <strong>Atributos:</strong> Agrega atributos relevantes como volumen, peso, color,
              sabor, etc. para facilitar la búsqueda.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
