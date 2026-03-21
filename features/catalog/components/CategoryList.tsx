"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Edit2, Trash2, Folder, Tag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BusinessCategory } from "../types/catalog.types";

// Industry category option type
interface IndustryCategoryOption {
  id: string;
  name: string;
}

interface CategoryListProps {
  categories: BusinessCategory[];
  industryCategories: IndustryCategoryOption[];
  onCreate: (data: {
    name: string;
    slug: string;
    industryCategoryId: string;
    description?: string;
  }) => void;
  onUpdate: (
    id: string,
    data: {
      name: string;
      slug: string;
      industryCategoryId: string;
      description?: string;
    }
  ) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function CategoryList({
  categories,
  industryCategories,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false,
}: CategoryListProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BusinessCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<BusinessCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    industryCategoryId: "",
    description: "",
  });

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Trim hyphens
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      industryCategoryId: "",
      description: "",
    });
  };

  // Open create dialog
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (category: BusinessCategory) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      industryCategoryId: category.industryCategoryId,
      description: category.description || "",
    });
    setEditingCategory(category);
  };

  // Handle name change and auto-generate slug if empty
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  // Handle create
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim() || !formData.industryCategoryId) return;

    onCreate({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      industryCategoryId: formData.industryCategoryId,
      description: formData.description.trim() || undefined,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  // Handle update
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingCategory ||
      !formData.name.trim() ||
      !formData.slug.trim() ||
      !formData.industryCategoryId
    )
      return;

    onUpdate(editingCategory.id, {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      industryCategoryId: formData.industryCategoryId,
      description: formData.description.trim() || undefined,
    });
    setEditingCategory(null);
    resetForm();
  };

  // Handle delete
  const handleDelete = () => {
    if (!deletingCategory) return;

    onDelete(deletingCategory.id);
    setDeletingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t("categories.title")}
          </h3>
          <p className="text-sm text-slate-500">{t("categories.subtitle")}</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          {t("categories.new")}
        </Button>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-card-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Folder className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-medium text-slate-900 mb-2">
            {t("categories.noCategories")}
          </h4>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            {t("categories.emptyDescription")}
          </p>
          <Button onClick={handleOpenCreate} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            {t("categories.createFirst")}
          </Button>
        </div>
      )}

      {/* Categories Table */}
      {categories.length > 0 && (
        <div className="border rounded-card-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  {tCommon("fields.name")}
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  Slug
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">
                  {t("categories.industryCategory")}
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-700">
                  {tCommon("fields.status")}
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">
                  {tCommon("fields.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category.id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">
                        {category.name}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-xs text-slate-500 mt-0.5 ml-6">
                        {category.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600">
                      {category.industryCategoryName ||
                        industryCategories.find(
                          (ic) => ic.id === category.industryCategoryId
                        )?.name ||
                        category.industryCategoryId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 text-xs rounded-full",
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {category.isActive
                        ? tCommon("status.active")
                        : tCommon("status.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(category)}
                        disabled={isLoading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setDeletingCategory(category)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("categories.new")}</DialogTitle>
            <DialogDescription>
              {t("categories.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">
                {tCommon("fields.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t("categories.namePlaceholder")}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="mi-categoria"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                {t("categories.slugHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-industry">
                {t("categories.industryCategory")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.industryCategoryId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, industryCategoryId: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="category-industry">
                  <SelectValue
                    placeholder={t("categories.selectIndustryCategory")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {industryCategories.map((ic) => (
                    <SelectItem key={ic.id} value={ic.id}>
                      {ic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">
                {tCommon("fields.description")}
              </Label>
              <Input
                id="category-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("categories.descriptionPlaceholder")}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isLoading}
              >
                {tCommon("buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.name.trim() ||
                  !formData.slug.trim() ||
                  !formData.industryCategoryId
                }
                isLoading={isLoading}
              >
                {t("categories.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("categories.edit")}</DialogTitle>
            <DialogDescription>
              {t("categories.editDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">
                {tCommon("fields.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-category-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("categories.namePlaceholder")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-category-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="mi-categoria"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-industry">
                {t("categories.industryCategory")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.industryCategoryId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, industryCategoryId: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="edit-category-industry">
                  <SelectValue
                    placeholder={t("categories.selectIndustryCategory")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {industryCategories.map((ic) => (
                    <SelectItem key={ic.id} value={ic.id}>
                      {ic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-description">
                {tCommon("fields.description")}
              </Label>
              <Input
                id="edit-category-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("categories.descriptionPlaceholder")}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={isLoading}
              >
                {tCommon("buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.name.trim() ||
                  !formData.slug.trim() ||
                  !formData.industryCategoryId
                }
                isLoading={isLoading}
              >
                {tCommon("buttons.saveChanges")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t("categories.delete")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCategory &&
                t("categories.deleteDescription", { name: deletingCategory.name })}
              {deletingCategory && (
                <p className="mt-2 text-amber-600">
                  {t("categories.deleteWarning")}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {tCommon("buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {tCommon("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
