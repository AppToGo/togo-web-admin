"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, AlertCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  GlobalProduct,
  BusinessCategory,
  ActivateCatalogProductDto,
} from "../types/catalog.types";
import { generateSlug } from "../utils/slug";

const SELECT_NONE = "__none__" as const;
const SELECT_DISABLED = "__disabled__" as const;

interface ActivateProductDrawerProps {
  product: GlobalProduct | null;
  categories: BusinessCategory[];
  isOpen: boolean;
  onClose: () => void;
  onActivate: (data: ActivateCatalogProductDto) => void;
  isLoading?: boolean;
  showProductImages?: boolean;
}

export function ActivateProductDrawer({
  product,
  categories,
  isOpen,
  onClose,
  onActivate,
  isLoading = false,
  showProductImages = true,
}: ActivateProductDrawerProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");

  const [industryCategoryId, setIndustryCategoryId] = useState("");
  const [businessCategoryId, setBusinessCategoryId] = useState("");
  const [variantPrices, setVariantPrices] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!industryCategoryId) return [];
    return categories.filter(c => c.industryCategoryId === industryCategoryId);
  }, [categories, industryCategoryId]);

  useEffect(() => {
    if (product) {
      setIndustryCategoryId("");
      setBusinessCategoryId("");
      setErrors({});
      const initial: Record<string, string> = {};
      for (const v of product.variants ?? []) {
        initial[v.id] = v.suggestedPrice?.toString() ?? "";
      }
      setVariantPrices(initial);
    }
  }, [product]);

  if (!product) return null;

  const variants = product.variants ?? [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const v of variants) {
      const val = variantPrices[v.id];
      if (!val || parseFloat(val) <= 0) {
        newErrors[v.id] = tCommon("validation.priceGreaterThanZero");
      }
    }
    if (variants.length === 0) {
      newErrors.global = t("activateModal.noVariants");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !product) return;

    onActivate({
      globalProductId: product.id,
      slug: generateSlug(product.name),
      businessCategoryId: businessCategoryId || undefined,
      variantPrices: variants.map((v) => ({
        globalVariantId: v.id,
        price: parseFloat(variantPrices[v.id] || "0"),
      })),
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={() => !isLoading && onClose()} isLoading={isLoading}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            {t("activateModal.title")}
          </DrawerTitle>
          <DrawerDescription>
            {t("activateModal.description", { name: product.name })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
        <form id="activate-product-form" onSubmit={handleSubmit} className="space-y-4 mt-4 px-7 pb-7">
          {/* Product Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-card">
            {showProductImages && (
              <div className="w-12 h-12 rounded-card bg-white flex items-center justify-center overflow-hidden shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-slate-300" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500">
                  {tCommon("fields.sku")}: {product.sku}
                </p>
                {variants.length > 1 && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
                    <Layers className="w-3 h-3" />
                    {t("activateModal.variantsCount", { count: variants.length })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activate-parentCategory">{t("products.form.parentCategory")}</Label>
              <Select
                value={industryCategoryId || SELECT_NONE}
                onValueChange={(value) => {
                  const newParentId = value === SELECT_NONE ? "" : value;
                  const subcatStillValid = categories.some(
                    c => c.id === businessCategoryId && c.industryCategoryId === newParentId
                  );
                  setIndustryCategoryId(newParentId);
                  if (!subcatStillValid) setBusinessCategoryId("");
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

            <div className="space-y-2">
              <Label htmlFor="activate-subcategory">{t("products.form.subcategoryOptional")}</Label>
              <Select
                value={businessCategoryId || SELECT_NONE}
                onValueChange={(value) =>
                  setBusinessCategoryId(value === SELECT_NONE ? "" : value)
                }
                disabled={isLoading || !industryCategoryId || filteredSubcategories.length === 0}
              >
                <SelectTrigger id="activate-subcategory">
                  <SelectValue placeholder={t("products.form.selectSubcategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>{t("products.form.selectSubcategory")}</SelectItem>
                  {filteredSubcategories.length === 0 && industryCategoryId ? (
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
              {industryCategoryId && !businessCategoryId && (
                <p className="text-xs text-slate-500">
                  {t("products.form.subcategoryFallbackHint", {
                    parentName: parentCategories.find(p => p.id === industryCategoryId)?.name ?? "",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Variant Prices */}
          <div className="space-y-3">
            <Label>
              {t("products.priceByVariant")}{" "}
              <span className="text-red-500">*</span>
            </Label>

            {errors.global && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.global}
              </p>
            )}

            {variants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-3 p-3 border rounded-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{variant.variantLabel}</p>
                  {variant.suggestedPrice && (
                    <p className="text-xs text-slate-500">
                      {t("products.suggestedPrice")}:{" "}
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(variant.suggestedPrice)}
                    </p>
                  )}
                </div>
                <div className="w-36">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={variantPrices[variant.id] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setVariantPrices(prev => ({ ...prev, [variant.id]: val }));
                          if (errors[variant.id]) {
                            setErrors(prev => {
                              const next = { ...prev };
                              delete next[variant.id];
                              return next;
                            });
                          }
                        }
                      }}
                      placeholder="0"
                      disabled={isLoading}
                      className={cn("pl-6", errors[variant.id] && "border-red-500 focus-visible:ring-red-500")}
                    />
                  </div>
                  {errors[variant.id] && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors[variant.id]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-card text-xs text-blue-700">
            <p>
              <strong>{tCommon("notifications.info")}:</strong>{" "}
              {t("activateProductNote")}
            </p>
          </div>
        </form>
        </div>

        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {tCommon("buttons.cancel")}
          </Button>
          <Button
            type="submit"
            form="activate-product-form"
            disabled={isLoading || variants.length === 0}
            isLoading={isLoading}
          >
            {t("activateModal.title")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
