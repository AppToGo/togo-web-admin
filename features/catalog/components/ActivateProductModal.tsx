"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BranchInventorySelector,
  InitialInventoryConfig,
} from "@/features/branch-inventory/components/BranchInventorySelector";
import type { Branch } from "@/features/branches/types";
import type {
  GlobalProduct,
  BusinessCategory,
  ActivateGlobalProductDto,
} from "../types/catalog.types";

const SELECT_NONE = "__none__" as const;
const SELECT_DISABLED = "__disabled__" as const;

interface ActivateProductModalProps {
  product: GlobalProduct | null;
  categories: BusinessCategory[];
  branches: Branch[];
  isOpen: boolean;
  onClose: () => void;
  onActivate: (data: ActivateGlobalProductDto) => void;
  isLoading?: boolean;
  showProductImages?: boolean;
}

export function ActivateProductModal({
  product,
  categories,
  branches,
  isOpen,
  onClose,
  onActivate,
  isLoading = false,
  showProductImages = true,
}: ActivateProductModalProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    industryCategoryId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialInventory, setInitialInventory] = useState<
    InitialInventoryConfig[]
  >([]);

  const parentCategories = useMemo(() => {
    const seen = new Set<string>();
    const parents: { id: string; name: string }[] = [];
    for (const cat of categories) {
      if (cat.industryCategoryId && cat.industryCategoryName && !seen.has(cat.industryCategoryId)) {
        seen.add(cat.industryCategoryId);
        parents.push({ id: cat.industryCategoryId, name: cat.industryCategoryName });
      }
    }
    return parents.sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const filteredSubcategories = useMemo(() => {
    if (!formData.industryCategoryId) return [];
    return categories.filter(c => c.industryCategoryId === formData.industryCategoryId);
  }, [categories, formData.industryCategoryId]);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.basePrice?.toString() ?? "",
        stock: "",
        categoryId: "",
        industryCategoryId: "",
      });
      setErrors({});
      setInitialInventory([]);
    }
  }, [product]);

  // Handle number input
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error when user types
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  // Handle text input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = tCommon("validation.required");
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = tCommon("validation.priceGreaterThanZero");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !product) return;

    const submitData: ActivateGlobalProductDto = {
      globalProductId: product.id,
      slug: generateSlug(formData.name),
      price: parseFloat(formData.price),
      stock: formData.stock === "" ? undefined : parseInt(formData.stock, 10),
      categoryId: formData.categoryId || undefined,
      industryCategoryId: formData.industryCategoryId || undefined,
      initialInventory:
        initialInventory.length > 0 ? initialInventory : undefined,
    };

    onActivate(submitData);
  };

  // Handle close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            {t("activateModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("activateModal.description", { name: product.name })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-7 pb-7">
          {/* Product Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-card">
            {showProductImages && (
              <div className="w-12 h-12 rounded-card bg-white flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-300" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">
                {product.name}
              </p>
              <p className="text-xs text-slate-500">
                {tCommon("fields.sku")}: {product.sku}
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="activate-name">
              {t("products.name")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="activate-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("products.form.namePlaceholder")}
              disabled={isLoading}
              className={cn(
                errors.name && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
            <p className="text-xs text-slate-500">{t("customizeNameHint")}</p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="activate-price">
              {t("products.salePrice")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <Input
                id="activate-price"
                name="price"
                type="text"
                inputMode="decimal"
                value={formData.price}
                onChange={handleNumberChange}
                placeholder="0"
                disabled={isLoading}
                className={cn(
                  "pl-6",
                  errors.price && "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
            {errors.price && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.price}
              </p>
            )}
            {product.basePrice && (
              <p className="text-xs text-slate-500">
                {t("products.suggestedPrice")}:{" "}
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(product.basePrice)}
              </p>
            )}
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="activate-stock">{t("products.stock")}</Label>
            <Input
              id="activate-stock"
              name="stock"
              type="text"
              inputMode="numeric"
              value={formData.stock}
              onChange={handleNumberChange}
              placeholder={t("stock.unlimited")}
              disabled={isLoading}
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Category (IndustryCategory) */}
            <div className="space-y-2">
              <Label htmlFor="activate-parentCategory">{t("products.form.parentCategory")}</Label>
              <Select
                value={formData.industryCategoryId || SELECT_NONE}
                onValueChange={(value) => {
                  const newParentId = value === SELECT_NONE ? "" : value;
                  const subcatStillValid = categories.some(
                    c => c.id === formData.categoryId && c.industryCategoryId === newParentId
                  );
                  setFormData(prev => ({
                    ...prev,
                    industryCategoryId: newParentId,
                    categoryId: subcatStillValid ? prev.categoryId : "",
                  }));
                }}
                disabled={isLoading || parentCategories.length === 0}
              >
                <SelectTrigger id="activate-parentCategory">
                  <SelectValue placeholder={t("products.form.selectParentCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>{t("products.form.selectParentCategory")}</SelectItem>
                  {parentCategories.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory (BusinessCategory) */}
            <div className="space-y-2">
              <Label htmlFor="activate-subcategory">{t("products.form.subcategoryOptional")}</Label>
              <Select
                value={formData.categoryId || SELECT_NONE}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, categoryId: value === SELECT_NONE ? "" : value }))
                }
                disabled={isLoading || !formData.industryCategoryId || filteredSubcategories.length === 0}
              >
                <SelectTrigger id="activate-subcategory">
                  <SelectValue placeholder={t("products.form.selectSubcategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>{t("products.form.selectSubcategory")}</SelectItem>
                  {filteredSubcategories.length === 0 && formData.industryCategoryId ? (
                    <SelectItem value={SELECT_DISABLED} disabled>
                      {t("products.form.noSubcategoriesInParent")}
                    </SelectItem>
                  ) : (
                    filteredSubcategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formData.industryCategoryId && !formData.categoryId && (
                <p className="text-xs text-slate-500">
                  {t("products.form.subcategoryFallbackHint", {
                    parentName: parentCategories.find(p => p.id === formData.industryCategoryId)?.name ?? "",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Branch Inventory Selector */}
          {branches.length > 0 && (
            <div className="space-y-2">
              <Label>{t("products.branchAvailability")}</Label>
              <BranchInventorySelector
                branches={branches}
                basePrice={parseFloat(formData.price) || 0}
                value={initialInventory}
                onChange={setInitialInventory}
              />
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-card text-xs text-blue-700">
            <p>
              <strong>{tCommon("notifications.info")}:</strong>{" "}
              {t("activateProductNote")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {tCommon("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.price}
              isLoading={isLoading}
            >
              {t("activateModal.title")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
