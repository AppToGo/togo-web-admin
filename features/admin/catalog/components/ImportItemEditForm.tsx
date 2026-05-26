"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIndustries, useIndustryCategoriesByIds } from "../hooks";
import type { ImportItemDto, ImportVariantDraft, UpdateImportItemPayload } from "../types/admin-catalog.types";

interface ImportItemEditFormProps {
  formId: string;
  item: ImportItemDto;
  onSubmit: (payload: UpdateImportItemPayload) => void | Promise<void>;
  isLoading?: boolean;
}

export function ImportItemEditForm({ formId, item, onSubmit, isLoading }: ImportItemEditFormProps) {
  const t = useTranslations("admin-catalog");
  const tCommon = useTranslations("common");

  const [name, setName] = useState(item.name);
  const [sku, setSku] = useState(item.sku ?? "");
  const [brand, setBrand] = useState(item.brand ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  // price lives in variants now; if item has a single "Unidad" variant, surface its suggestedPrice
  // as a convenience so the user can see/edit the simple price without digging into the variant row.
  const defaultPrice = item.price != null
    ? item.price
    : (item.variants?.length === 1 ? item.variants[0].suggestedPrice : undefined);
  const [price, setPrice] = useState(defaultPrice != null ? String(defaultPrice) : "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>("");
  const [industryCategoryId, setIndustryCategoryId] = useState(item.industryCategoryId ?? "");
  const [variants, setVariants] = useState<ImportVariantDraft[]>(item.variants ?? []);
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);

  const { data: industries } = useIndustries();
  const { data: categories } = useIndustryCategoriesByIds(
    selectedIndustryId ? [selectedIndustryId] : [],
  );

  const handleImageUrlChange = (value: string) => {
    setImageUrl(value);
    if (value && !value.startsWith("https://")) {
      setImageUrlError(t("imageMustBeHttps"));
    } else {
      setImageUrlError(null);
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { variantLabel: "" }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof ImportVariantDraft, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        if (field === "suggestedPrice") {
          const num = parseFloat(value);
          return { ...v, suggestedPrice: isNaN(num) ? undefined : num };
        }
        return { ...v, [field]: value };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrlError) return;

    const filteredVariants = variants.filter((v) => v.variantLabel.trim());
    const parsedPrice = price ? parseFloat(price) : undefined;
    const resolvedPrice =
      filteredVariants.length > 0
        ? undefined
        : parsedPrice !== undefined && isFinite(parsedPrice)
          ? parsedPrice
          : undefined;
    const payload: UpdateImportItemPayload = {
      name: name.trim() || item.name,
      sku: sku.trim() || undefined,
      brand: brand.trim() || undefined,
      description: description.trim() || undefined,
      price: resolvedPrice,
      imageUrl: imageUrl.trim() || undefined,
      industryCategoryId: industryCategoryId.trim() || undefined,
      variants: filteredVariants,
    };
    void onSubmit(payload);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5 p-6">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-name`}>{t("importItemFields.name")}</Label>
        <Input
          id={`${formId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* SKU */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-sku`}>{t("importItemFields.sku")}</Label>
        <Input
          id={`${formId}-sku`}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          disabled={isLoading}
          placeholder="COCA-COLA-350ML"
        />
      </div>

      {/* Brand */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-brand`}>{t("importItemFields.brand")}</Label>
        <Input
          id={`${formId}-brand`}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-description`}>{t("importItemFields.description")}</Label>
        <Textarea
          id={`${formId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-price`}>{t("importItemFields.price")}</Label>
        <Input
          id={`${formId}-price`}
          type="number"
          min="0"
          step="any"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Image URL */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-imageUrl`}>{t("importItemFields.imageUrl")}</Label>
        <Input
          id={`${formId}-imageUrl`}
          type="url"
          value={imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          disabled={isLoading}
          placeholder="https://..."
        />
        {imageUrlError && (
          <p className="text-xs text-red-500">{imageUrlError}</p>
        )}
      </div>

      {/* Industry Category */}
      <div className="space-y-1.5">
        <Label>{t("importItemFields.industryCategory")}</Label>
        <Select
          value={selectedIndustryId}
          onValueChange={(val) => {
            setSelectedIndustryId(val);
            setIndustryCategoryId("");
          }}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectIndustry")} />
          </SelectTrigger>
          <SelectContent>
            {industries?.map((ind) => (
              <SelectItem key={ind.id} value={ind.id}>
                {ind.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedIndustryId && categories && categories.length > 0 && (
          <Select
            value={industryCategoryId}
            onValueChange={setIndustryCategoryId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{tCommon("fields.variants")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariant}
            disabled={isLoading}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {tCommon("buttons.add")}
          </Button>
        </div>
        {variants.length === 0 && (
          <p className="text-xs text-slate-400">{t("variants.noVariants")}</p>
        )}
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <div className="space-y-1">
              <Input
                value={v.variantLabel}
                onChange={(e) => handleVariantChange(i, "variantLabel", e.target.value)}
                placeholder={t("attributePlaceholder")}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                min="0"
                step="any"
                value={v.suggestedPrice ?? ""}
                onChange={(e) => handleVariantChange(i, "suggestedPrice", e.target.value)}
                placeholder={t("importItemFields.price")}
                disabled={isLoading}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 mt-0"
              onClick={() => handleRemoveVariant(i)}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </form>
  );
}
