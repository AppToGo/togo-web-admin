"use client";

import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/features/catalog/components/ProductForm";
import { useUpdateImportItem } from "../hooks/useImportMutations";
import type {
  BusinessCategory,
  CreateProductDto,
  UpdateCatalogProductDto,
} from "@/features/catalog/types/catalog.types";
import type { ImportItem, UpdateImportItemDto } from "../types/import.types";
import type { IndustryCategory } from "@/features/admin/industry-categories/types/industry-category.types";
import type { BranchActivation } from "@/features/catalog/components/ProductForm";

interface EditImportItemFormDrawerProps {
  item: ImportItem | null;
  businessId: string;
  categories: BusinessCategory[];
  industryCategories?: IndustryCategory[];
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export function EditImportItemFormDrawer({
  item,
  businessId,
  categories,
  industryCategories = [],
  isOpen,
  onClose,
  jobId,
}: EditImportItemFormDrawerProps) {
  const t = useTranslations("catalog.import.editItem");
  const tCommon = useTranslations("common");
  const updateMutation = useUpdateImportItem(businessId, jobId);

  const handleSubmit = (data: CreateProductDto | UpdateCatalogProductDto, _branchActivations?: BranchActivation[]) => {
    if (!item) return;

    const dto: UpdateImportItemDto = {};
    if (data.name) dto.name = data.name;
    if (data.description !== undefined) dto.description = data.description;
    if (data.businessCategoryId === "") {
      dto.businessCategoryId = null;
    } else if (data.businessCategoryId !== undefined) {
      dto.businessCategoryId = data.businessCategoryId;
    }
    if (data.industryCategoryId !== undefined)
      dto.industryCategoryId = data.industryCategoryId;

    if ("inlineVariants" in data && data.inlineVariants && data.inlineVariants.length > 0) {
      dto.variants = data.inlineVariants.map((v) => ({
        variantLabel: v.label,
        suggestedPrice: v.price,
      }));
    } else if ("price" in data && data.price !== undefined) {
      dto.price = data.price;
    } else if (item.price !== null) {
      // Fallback: preserve original price if form was submitted without price data
      dto.price = item.price;
    }

    updateMutation.mutate(
      { itemId: item.id, dto },
      { onSuccess: onClose }
    );
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!updateMutation.isPending && !open) onClose();
      }}
      isLoading={updateMutation.isPending}
    >
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {item && (
            <ProductForm
              key={item.id}
              formId="edit-import-item-form"
              hideActions
              businessId={businessId}
              categories={categories}
              industryCategoriesPool={industryCategories.map((ic) => ({ id: ic.id, name: ic.name }))}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={updateMutation.isPending}
              showProductImages={!!item.imageUrl}
              proposedSubcategoryName={
                !item.businessCategoryId && item.rawCategory && item.industryCategoryId ? item.rawCategory : undefined
              }
              initialValues={{
                name: item.name,
                description: item.description ?? undefined,
                image: item.imageUrl ?? undefined,
                businessCategoryId: item.businessCategoryId ?? undefined,
                industryCategoryId:
                  item.industryCategoryId ??
                  categories.find((c) => c.id === item.businessCategoryId)?.industryCategoryId ??
                  undefined,
                industryCategoryName:
                  (item.industryCategoryId
                    ? industryCategories.find((ic) => ic.id === item.industryCategoryId)?.name
                    : categories.find((c) => c.id === item.businessCategoryId)?.industryCategoryName) ??
                  undefined,
                businessCategoryName:
                  categories.find((c) => c.id === item.businessCategoryId)?.name ?? undefined,
                price: item.price ?? undefined,
                inlineVariants:
                  item.variants && item.variants.length > 0
                    ? item.variants.map((v) => ({ label: v.variantLabel, price: v.suggestedPrice ?? 0 }))
                    : undefined,
              }}
            />
          )}
        </div>

        <DrawerFooter className="border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            {tCommon("buttons.cancel")}
          </Button>
          <Button
            type="submit"
            form="edit-import-item-form"
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending}
          >
            {t("save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
