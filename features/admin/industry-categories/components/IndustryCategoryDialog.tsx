"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  IndustryCategory,
  CreateIndustryCategoryDto,
} from "../types/industry-category.types";

interface IndustryCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: IndustryCategory | null;
  industries: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateIndustryCategoryDto) => void;
  isSubmitting?: boolean;
}

// Helper function to slugify text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function IndustryCategoryDialog({
  isOpen,
  onClose,
  category,
  industries,
  onSubmit,
  isSubmitting = false,
}: IndustryCategoryDialogProps) {
  const t = useTranslations("admin-industry-categories");
  const isEditing = !!category;

  const [formData, setFormData] = useState<CreateIndustryCategoryDto>({
    name: "",
    slug: "",
    industryId: "",
    order: 0,
    icon: "",
    color: "#6366f1",
    isActive: true,
  });

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name,
          slug: category.slug,
          industryId: category.industryId,
          order: category.order,
          icon: category.icon || "",
          color: category.color || "#6366f1",
          isActive: category.isActive,
        });
      } else {
        setFormData({
          name: "",
          slug: "",
          industryId: "",
          order: 0,
          icon: "",
          color: "#6366f1",
          isActive: true,
        });
      }
    }
  }, [isOpen, category]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const newFormData = { ...formData, name };
    // Only auto-generate slug if it's empty or matches the previous slugified name
    if (!isEditing) {
      const expectedSlug = slugify(formData.name);
      if (!formData.slug || formData.slug === expectedSlug) {
        newFormData.slug = slugify(name);
      }
    }
    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error(t("validation.nameRequired"));
      return;
    }
    if (!formData.slug.trim()) {
      toast.error(t("validation.slugRequired"));
      return;
    }
    if (!formData.industryId) {
      toast.error(t("validation.industryRequired"));
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {isEditing ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">
              {t("fields.name")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t("placeholders.name")}
              className="border-slate-200"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-slate-700">
              {t("fields.slug")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: slugify(e.target.value) })
              }
              placeholder={t("placeholders.slug")}
              className="border-slate-200"
            />
            <p className="text-xs text-slate-500">{t("helpers.slug")}</p>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-slate-700">
              {t("fields.industry")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.industryId}
              onValueChange={(value) =>
                setFormData({ ...formData, industryId: value })
              }
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder={t("placeholders.selectIndustry")} />
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

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order" className="text-slate-700">
              {t("fields.order")}
            </Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
              className="border-slate-200"
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="icon" className="text-slate-700">
              {t("fields.icon")}
            </Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder={t("placeholders.icon")}
              className="border-slate-200"
            />
            <p className="text-xs text-slate-500">{t("helpers.icon")}</p>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-slate-700">
              {t("fields.color")}
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="h-10 w-10 rounded-md border border-slate-200 cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#6366f1"
                className="flex-1 border-slate-200"
              />
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-slate-700">
                {t("fields.isActive")}
              </Label>
              <p className="text-xs text-slate-500">
                {t("helpers.isActive")}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("buttons.saving")
                : isEditing
                ? t("buttons.save")
                : t("buttons.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
