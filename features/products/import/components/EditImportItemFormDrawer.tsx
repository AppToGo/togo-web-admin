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

interface EditImportItemFormDrawerProps {
  item: ImportItem | null;
  businessId: string;
  categories: BusinessCategory[];
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export function EditImportItemFormDrawer({
  item,
  businessId,
  categories,
  isOpen,
  onClose,
  jobId,
}: EditImportItemFormDrawerProps) {
  const t = useTranslations("catalog.import.editItem");
  const tCommon = useTranslations("common");
  const updateMutation = useUpdateImportItem(businessId, jobId);

  const handleSubmit = (data: CreateProductDto | UpdateCatalogProductDto) => {
    if (!item) return;

    const dto: UpdateImportItemDto = {};
    if (data.name) dto.name = data.name;
    if (data.description !== undefined) dto.description = data.description;
    if (data.businessCategoryId !== undefined)
      dto.businessCategoryId = data.businessCategoryId;

    // price and inlineVariants only exist on CreateProductDto (create mode — product prop is always null here)
    if ("price" in data && data.price !== undefined) {
      dto.price = data.price;
    } else if ("inlineVariants" in data && data.inlineVariants && data.inlineVariants.length > 0) {
      dto.price = data.inlineVariants[0].price;
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
              formId="edit-import-item-form"
              hideActions
              businessId={businessId}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={updateMutation.isPending}
              showProductImages={!!item.imageUrl}
              initialValues={{
                name: item.name,
                description: item.description ?? undefined,
                image: item.imageUrl ?? undefined,
                businessCategoryId: item.businessCategoryId ?? undefined,
                // item.industryCategoryId comes directly from the API; fall back to resolving via categories
                industryCategoryId:
                  item.industryCategoryId ??
                  categories.find((c) => c.id === item.businessCategoryId)?.industryCategoryId ??
                  undefined,
                price: item.price ?? undefined,
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
