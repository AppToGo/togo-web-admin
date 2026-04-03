"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Package, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BranchInventorySelector,
  type InitialInventoryConfig,
} from "@/features/branch-inventory/components/BranchInventorySelector";
import type { Branch } from "@/features/branches/types";
import type {
  BusinessProduct,
  BusinessCategory,
  CreateSimpleProductDto,
  UpdateProductDto,
} from "../types/catalog.types";
import type { BranchAvailability } from "../types/hybrid-catalog.types";

interface ProductFormProps {
  product?: BusinessProduct | null;
  categories: BusinessCategory[];
  branches?: Branch[];
  branchAvailability?: BranchAvailability[];
  onSubmit: (data: CreateSimpleProductDto | UpdateProductDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  product,
  categories,
  branches = [],
  branchAvailability = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const isEditing = !!product;
  const isFromTemplate = product?.isFromTemplate ?? false;

  // Form state - isActive siempre true (no hay estado global de producto)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    image: "",
    categoryId: "",
  });

  // Initial inventory state (for new products) / Branch inventory state (for editing)
  const [initialInventory, setInitialInventory] = useState<
    InitialInventoryConfig[]
  >([]);

  // Track if branch inventory has been modified during edit
  const [hasModifiedBranchInventory, setHasModifiedBranchInventory] = useState(false);

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Initialize form with product data when editing
  useEffect(() => {
    if (product) {
      // Use custom fields if they exist, otherwise fall back to computed fields
      const displayName = product.customName ?? product.name ?? "";
      const displayDescription = product.customDescription ?? product.description ?? "";
      const displayImage = product.customImage ?? product.image ?? "";

      setFormData({
        name: displayName,
        price: product.price?.toString() ?? "",
        stock: product.stock?.toString() ?? "",
        description: displayDescription,
        image: displayImage,
        categoryId: product.categoryId ?? "",
      });
      setImagePreview(displayImage || product.globalProduct?.image || null);
    }
  }, [product]);

  // Initialize branch inventory from branchAvailability when editing
  useEffect(() => {
    if (isEditing && branchAvailability && branchAvailability.length > 0) {
      const inventoryConfig: InitialInventoryConfig[] = branchAvailability.map(
        (ba) => ({
          branchId: ba.branchId,
          branchName: ba.branchName,
          isAvailable: ba.isAvailable,
          priceOverride: ba.priceOverride ?? undefined,
          stock: ba.stock ?? undefined,
        })
      );
      setInitialInventory(inventoryConfig);
    }
  }, [isEditing, branchAvailability]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle image URL change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url || null);
  };

  // Handle branch inventory changes during edit
  const handleBranchInventoryChange = (inventory: InitialInventoryConfig[]) => {
    setInitialInventory(inventory);
    if (isEditing) {
      setHasModifiedBranchInventory(true);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use simple DTO for forms - service will convert to backend format
    // isActive siempre true - no hay estado global de producto
    const data: CreateSimpleProductDto | UpdateProductDto = isEditing
      ? {
          // Update: send only changed fields using backend field names
          price: parseFloat(formData.price),
          stock: formData.stock === "" ? null : parseInt(formData.stock, 10),
          customName: formData.name,
          customDescription: formData.description || undefined,
          customImage: formData.image || null,
          categoryId: formData.categoryId || null,
          isActive: true,
          // Include branch inventory updates if modified
          ...(hasModifiedBranchInventory && initialInventory.length > 0
            ? {
                branchInventory: initialInventory.map((inv) => ({
                  branchId: inv.branchId,
                  isAvailable: inv.isAvailable,
                  priceOverride: inv.priceOverride,
                  stock: inv.stock,
                })),
              }
            : {}),
        }
      : {
          // Create: use simple DTO (will be converted by service)
          name: formData.name,
          price: parseFloat(formData.price),
          stock:
            formData.stock === "" ? undefined : parseInt(formData.stock, 10),
          description: formData.description || undefined,
          image: formData.image || undefined,
          categoryId: formData.categoryId || undefined,
          isActive: true,
          // Include initial inventory for branch activation
          initialInventory:
            initialInventory.length > 0
              ? initialInventory.map((inv) => ({
                  branchId: inv.branchId,
                  isAvailable: inv.isAvailable,
                  priceOverride: inv.priceOverride,
                  stock: inv.stock,
                }))
              : undefined,
        };

    onSubmit(data);
  };

  // Show warning if no branches selected for new product
  const showInventoryWarning =
    !isEditing && branches.length > 0 && initialInventory.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-7">
      {/* Image Preview */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32 rounded-card-lg bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden">
          {imagePreview ? (
            <>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImagePreview(null)}
              />
              {isFromTemplate && product?.globalProduct?.image && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">
                  {t("inheritedFromCatalog")}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Package className="w-10 h-10 mb-1" />
              <span className="text-xs">{tCommon("status.noImage")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("products.name")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t("products.form.namePlaceholder")}
          required
          disabled={isLoading}
        />
        {isFromTemplate && (
          <p className="text-xs text-blue-600">
            {t("inheritedFrom", { name: product?.globalProduct?.name ?? "" })}
          </p>
        )}
      </div>

      {/* Price and Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">
            {t("products.price")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              $
            </span>
            <Input
              id="price"
              name="price"
              type="text"
              inputMode="decimal"
              value={formData.price}
              onChange={handleNumberChange}
              placeholder="0"
              required
              disabled={isLoading}
              className="pl-6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">{t("products.stockOptional")}</Label>
          <Input
            id="stock"
            name="stock"
            type="text"
            inputMode="numeric"
            value={formData.stock}
            onChange={handleNumberChange}
            placeholder={t("stock.unlimited")}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">{t("products.category")}</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, categoryId: value }))
          }
          disabled={isLoading || categories.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("products.form.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 ? (
              <SelectItem value="" disabled>
                {t("categories.noCategories")}
              </SelectItem>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t("products.description")}</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t("products.form.descriptionPlaceholder")}
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image">{t("products.imageUrl")}</Label>
        <Input
          id="image"
          name="image"
          type="url"
          value={formData.image}
          onChange={handleImageChange}
          placeholder={t("products.imagePlaceholder")}
          disabled={isLoading}
        />
        {isFromTemplate && !formData.image && (
          <p className="text-xs text-slate-500">
            {t("imageFallbackDescription")}
          </p>
        )}
      </div>

      {/* Branch Inventory Selector (for new products) */}
      {!isEditing && branches.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <BranchInventorySelector
            branches={branches}
            basePrice={parseFloat(formData.price) || 0}
            value={initialInventory}
            onChange={handleBranchInventoryChange}
          />
        </div>
      )}

      {/* Branch Inventory Editor (for editing products) */}
      {isEditing && branches.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {t("products.branchAvailability")}
            </span>
            {hasModifiedBranchInventory && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {t("products.modified")}
              </span>
            )}
          </div>
          <BranchInventorySelector
            branches={branches}
            basePrice={parseFloat(formData.price) || 0}
            value={initialInventory}
            onChange={handleBranchInventoryChange}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {tCommon("buttons.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name || !formData.price}
          isLoading={isLoading}
        >
          {isEditing ? tCommon("buttons.saveChanges") : t("products.create")}
        </Button>
      </div>
    </form>
  );
}
