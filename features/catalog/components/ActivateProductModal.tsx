"use client";

import { useState, useEffect } from "react";
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
import type {
  GlobalProduct,
  BusinessCategory,
  ActivateGlobalProductDto,
} from "../types/catalog.types";

interface ActivateProductModalProps {
  product: GlobalProduct | null;
  categories: BusinessCategory[];
  isOpen: boolean;
  onClose: () => void;
  onActivate: (data: ActivateGlobalProductDto) => void;
  isLoading?: boolean;
}

export function ActivateProductModal({
  product,
  categories,
  isOpen,
  onClose,
  onActivate,
  isLoading = false,
}: ActivateProductModalProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.basePrice?.toString() ?? "",
        stock: "",
        categoryId: "",
      });
      setErrors({});
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

    const data: ActivateGlobalProductDto = {
      globalProductId: product.id,
      slug: generateSlug(formData.name),
      price: parseFloat(formData.price),
      stock: formData.stock === "" ? undefined : parseInt(formData.stock, 10),
      categoryId: formData.categoryId || undefined,
    };

    onActivate(data);
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
      <DialogContent className="sm:max-w-md">
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

          {/* Stock and Category */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="activate-category">
                {t("products.category")}
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoryId: value }))
                }
                disabled={isLoading || categories.length === 0}
              >
                <SelectTrigger id="activate-category">
                  <SelectValue placeholder={tCommon("actions.select")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
