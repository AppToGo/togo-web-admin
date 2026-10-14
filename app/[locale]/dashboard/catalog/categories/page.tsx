"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Tags, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryList } from "@/features/catalog/components";
import {
  catalogKeys,
  useBusiness,
  useCategories,
  useIndustryCategories,
  useIndustryCategoriesByIndustry,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryStatus,
  useRegenerateCategoryKeywords,
} from "@/features/catalog/hooks";

export default function CategoriesPage() {
  const t = useTranslations("catalog");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const businessId = useEffectiveBusinessId();

  // HOOKS
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useCategories(businessId ?? "");
  // Solo las categorías de la industria del negocio (como la importación de
  // productos), no las de todas las industrias. Un negocio sin industria
  // asignada ve todas: si no, no podría crear ninguna categoría.
  const { data: businessData, isSuccess: isBusinessLoaded } = useBusiness(
    businessId ?? ""
  );
  const industryId = businessData?.industryId ?? null;
  const { data: byIndustryData } = useIndustryCategoriesByIndustry(industryId);
  const { data: allIndustryCategoriesData } = useIndustryCategories({
    queryKey: catalogKeys.industryCategories(),
    enabled: isBusinessLoaded && !industryId,
  });
  const categories = useMemo(
    () => (Array.isArray(categoriesData) ? categoriesData : []),
    [categoriesData]
  );
  const industryCategories = useMemo(() => {
    const source = industryId ? byIndustryData : allIndustryCategoriesData;
    const options: Array<{ id: string; name: string }> = Array.isArray(source)
      ? source.map(({ id, name }) => ({ id, name }))
      : [];
    // Categorías ya creadas que apuntan a una categoría de otra industria
    // (datos previos al filtro): se conserva su opción para que editarlas
    // no deje el selector vacío ni pierda el vínculo al guardar.
    const known = new Set(options.map((option) => option.id));
    for (const category of categories) {
      if (category.industryCategoryId && !known.has(category.industryCategoryId)) {
        known.add(category.industryCategoryId);
        options.push({
          id: category.industryCategoryId,
          name: category.industryCategoryName ?? category.industryCategoryId,
        });
      }
    }
    return options;
  }, [industryId, byIndustryData, allIndustryCategoriesData, categories]);

  // MUTACIONES
  const createCategory = useCreateCategory(businessId ?? "");
  const updateCategory = useUpdateCategory(businessId ?? "");
  const deleteCategory = useDeleteCategory(businessId ?? "");
  const toggleCategory = useToggleCategoryStatus(businessId ?? "");
  const regenerateKeywords = useRegenerateCategoryKeywords(businessId ?? "");

  // Guard consolidado, después de todos los hooks
  if (!businessId || (!hasBusiness && !isSuperAdmin)) {
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
              {categoriesError instanceof Error
                ? categoriesError.message
                : "An unexpected error occurred"}
            </p>
          </div>
        ) : (
          <CategoryList
            categories={categories}
            industryCategories={industryCategories}
            onCreate={(data) =>
              createCategory.mutate({
                name: data.name,
                slug: data.slug,
                industryCategoryId: data.industryCategoryId,
                description: data.description,
                searchKeywords: data.searchKeywords,
              })
            }
            onUpdate={(id, data) =>
              updateCategory.mutate({
                categoryId: id,
                data: {
                  name: data.name,
                  slug: data.slug,
                  industryCategoryId: data.industryCategoryId,
                  description: data.description,
                  searchKeywords: data.searchKeywords,
                },
              })
            }
            onDelete={(id) => deleteCategory.mutate(id)}
            onToggleStatus={(id, isActive) =>
              toggleCategory.mutate({ categoryId: id, isActive })
            }
            onRegenerateKeywords={(id) => regenerateKeywords.mutate(id)}
            isRegeneratingKeywords={regenerateKeywords.isPending}
            isLoading={
              createCategory.isPending ||
              updateCategory.isPending ||
              deleteCategory.isPending ||
              toggleCategory.isPending
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
