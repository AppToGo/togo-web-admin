"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { useUpdateImportItem, useDeleteImportItem } from "../hooks/useImportMutations";
import { importItemToCatalogProduct } from "../utils/importItemMapper";
import { EditImportItemFormDrawer } from "./EditImportItemFormDrawer";
import { DeleteImportItemDialog } from "./DeleteImportItemDialog";
import type { BusinessCategory } from "@/features/catalog/types/catalog.types";
import type { IndustryCategory } from "@/features/admin/industry-categories/types/industry-category.types";
import type { ImportItem } from "../types/import.types";

interface DetectedProductsGridProps {
  businessId: string;
  jobId: string;
  items: ImportItem[];
  categories: BusinessCategory[];
  industryCategories?: IndustryCategory[];
  showImage?: boolean;
}

export function DetectedProductsGrid({
  businessId,
  jobId,
  items,
  categories,
  industryCategories,
  showImage = false,
}: DetectedProductsGridProps) {
  const t = useTranslations("catalog.import");
  const [editingItem, setEditingItem] = useState<ImportItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ImportItem | null>(null);

  const updateMutation = useUpdateImportItem(businessId, jobId);
  const deleteMutation = useDeleteImportItem(businessId, jobId);

  const isAnyMutationPending =
    updateMutation.isPending || deleteMutation.isPending;

  const selectedCount = items.filter((i) => i.isSelected).length;

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-card-lg border border-dashed border-slate-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm">{t("review.noProducts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">
          {t("review.headerTitle")}
        </p>
        <span className="text-xs text-slate-500">
          {t("review.selectedCount", {
            selected: selectedCount,
            total: items.length,
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const product = importItemToCatalogProduct(item);
          const categoryName = item.businessCategoryId
            ? (categories.find((c) => c.id === item.businessCategoryId)?.name ?? item.rawCategory ?? undefined)
            : item.rawCategory ?? undefined;

          return (
            <ProductCard
              key={item.id}
              product={product}
              showCheckbox
              selected={item.isSelected}
              showImage={showImage}
              categoryName={categoryName}
              onSelect={() => {
                if (isAnyMutationPending) return;
                updateMutation.mutate({
                  itemId: item.id,
                  dto: { isSelected: !item.isSelected },
                });
              }}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeletingItem(item)}
            />
          );
        })}
      </div>

      <EditImportItemFormDrawer
        item={editingItem}
        businessId={businessId}
        jobId={jobId}
        categories={categories}
        industryCategories={industryCategories}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
      />

      <DeleteImportItemDialog
        itemName={deletingItem?.name ?? null}
        isOpen={deletingItem !== null}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (!deletingItem) return;
          deleteMutation.mutate(deletingItem.id, {
            onSuccess: () => setDeletingItem(null),
          });
        }}
      />
    </div>
  );
}
