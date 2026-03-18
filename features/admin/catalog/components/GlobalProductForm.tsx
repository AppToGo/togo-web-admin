"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Check, X, AlertCircle, Plus, Trash2, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type {
  GlobalProduct,
  CreateGlobalProductDto,
  UpdateGlobalProductDto,
  Industry,
  IndustryCategory,
} from "../types/admin-catalog.types";
import { useCheckSkuAvailability } from "../hooks";

// ============================================================================
// TYPES
// ============================================================================

interface GlobalProductFormProps {
  product?: GlobalProduct | null;
  industries: Industry[];
  industryCategories: IndustryCategory[];
  onSubmit: (data: CreateGlobalProductDto | UpdateGlobalProductDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlobalProductForm({
  product,
  industries,
  industryCategories,
  onSubmit,
  onCancel,
  isLoading,
}: GlobalProductFormProps) {
  const isEditing = !!product;
  const t = useTranslations('admin-catalog');
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");

  // Form state
  const [formData, setFormData] = useState<CreateGlobalProductDto>({
    sku: "",
    name: "",
    description: "",
    image: "",
    brand: "",
    industryId: "",
    industryCategoryId: "",
    attributes: {},
    isActive: true,
  });

  // SKU validation state
  const [skuTouched, setSkuTouched] = useState(false);
  const [skuChecking, setSkuChecking] = useState(false);
  
  // Attributes state
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  
  // Image preview
  const [imagePreview, setImagePreview] = useState<string>("");

  // Check SKU availability
  const { data: skuCheck, isLoading: isCheckingSku } = useCheckSkuAvailability(
    formData.sku,
    product?.id
  );

  // Initialize form with product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        image: product.image || "",
        brand: product.brand || "",
        industryId: product.industryId,
        industryCategoryId: product.industryCategoryId || "",
        attributes: product.attributes || {},
        isActive: product.isActive,
      });
      setImagePreview(product.image || "");
      
      // Convert attributes object to array
      if (product.attributes) {
        setAttributes(
          Object.entries(product.attributes).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      }
    }
  }, [product]);

  // Filter categories by selected industry
  const filteredCategories = industryCategories.filter(
    (cat) => cat.industryId === formData.industryId
  );

  // Handle form changes
  const handleChange = (field: keyof CreateGlobalProductDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle SKU change with validation
  const handleSkuChange = (value: string) => {
    setFormData((prev) => ({ ...prev, sku: value.toUpperCase() }));
    setSkuTouched(true);
  };

  // Handle industry change - reset category
  const handleIndustryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      industryId: value,
      industryCategoryId: "",
    }));
  };

  // Add attribute
  const addAttribute = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  // Update attribute
  const updateAttribute = (index: number, field: "key" | "value", value: string) => {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr))
    );
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle image URL change
  const handleImageChange = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert attributes array to object
    const attributesObject = attributes.reduce((acc, { key, value }) => {
      if (key.trim()) {
        acc[key.trim()] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const submitData = {
      ...formData,
      attributes: attributesObject,
    };

    // Remove empty fields for update
    if (isEditing) {
      const updateData: UpdateGlobalProductDto = {};
      if (submitData.sku !== product?.sku) updateData.sku = submitData.sku;
      if (submitData.name !== product?.name) updateData.name = submitData.name;
      if (submitData.description !== product?.description) updateData.description = submitData.description;
      if (submitData.image !== product?.image) updateData.image = submitData.image;
      if (submitData.brand !== product?.brand) updateData.brand = submitData.brand;
      if (submitData.industryId !== product?.industryId) updateData.industryId = submitData.industryId;
      if (submitData.industryCategoryId !== product?.industryCategoryId) {
        updateData.industryCategoryId = submitData.industryCategoryId || undefined;
      }
      updateData.attributes = submitData.attributes;
      if (submitData.isActive !== product?.isActive) updateData.isActive = submitData.isActive;
      
      onSubmit(updateData);
    } else {
      onSubmit(submitData);
    }
  };

  // Validation
  const isSkuValid = !skuTouched || !isCheckingSku ? true : (skuCheck as { available: boolean } | undefined)?.available ?? true;
  const canSubmit =
    formData.sku &&
    formData.name &&
    formData.industryId &&
    isSkuValid &&
    !isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <Label className="font-medium">{t("productStatus")}</Label>
          <p className="text-sm text-slate-500">
            {formData.isActive ? t("activeVisible") : t("inactiveHidden")}
          </p>
        </div>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => handleChange("isActive", checked)}
        />
      </div>

      {/* SKU Field */}
      <div className="space-y-2">
        <Label htmlFor="sku">
          {tCatalog("products.sku")} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => handleSkuChange(e.target.value)}
            onBlur={() => setSkuTouched(true)}
            placeholder="Ej: COCA-COLA-350ML"
            className={cn(
              "uppercase",
              skuTouched &&
                !isCheckingSku &&
                !skuCheck?.available &&
                "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {skuTouched && !isCheckingSku && skuCheck?.available && formData.sku.length >= 3 && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
        {skuTouched && !isCheckingSku && !skuCheck?.available && (
          <p className="text-sm text-red-500">{t("skuExists")}</p>
        )}
        <p className="text-xs text-slate-500">
          {t("skuDescription")}
        </p>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {tCommon("fields.name")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder={tCatalog("products.form.namePlaceholder")}
        />
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">{tCatalog("products.description")}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={tCatalog("products.form.descriptionPlaceholder")}
          rows={3}
        />
      </div>

      {/* Brand Field */}
      <div className="space-y-2">
        <Label htmlFor="brand">{tCatalog("products.brand")}</Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => handleChange("brand", e.target.value)}
          placeholder="Ej: Coca Cola"
        />
      </div>

      {/* Industry & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="industry">
            {t("industry")} <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.industryId} onValueChange={handleIndustryChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectIndustry")} />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t("optionalCategory")}</Label>
          <Select
            value={formData.industryCategoryId}
            onValueChange={(value) => handleChange("industryCategoryId", value)}
            disabled={!formData.industryId || filteredCategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="image">{tCatalog("products.image")}</Label>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => handleImageChange(e.target.value)}
              placeholder={tCatalog("products.form.imageUrl")}
            />
          </div>
          <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImagePreview("")}
              />
            ) : (
              <ImagePlus className="w-8 h-8 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Attributes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("additionalAttributes")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="w-4 h-4 mr-1" />
            {tCommon("buttons.add")}
          </Button>
        </div>
        
        {attributes.length === 0 && (
          <p className="text-sm text-slate-500">
            {t("attributesHint")}
          </p>
        )}

        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={t("attributePlaceholder")}
              value={attr.key}
              onChange={(e) => updateAttribute(index, "key", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder={t("valuePlaceholder")}
              value={attr.value}
              onChange={(e) => updateAttribute(index, "value", e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAttribute(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Warning for editing */}
      {isEditing && product && product._count && product._count.businessProducts > 0 && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{tCommon("warning")}:</strong> {t("warningActivatedInBusinesses", { count: product._count.businessProducts })}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {tCommon("buttons.cancel")}
        </Button>
        <Button type="submit" disabled={!canSubmit || isLoading} isLoading={isLoading}>
          {isEditing ? tCommon("buttons.saveChanges") : tCatalog("products.create")}
        </Button>
      </div>
    </form>
  );
}
