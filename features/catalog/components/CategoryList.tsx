"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Edit2, Trash2, Folder, Tag, AlertCircle } from "lucide-react";
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

interface CategoryListProps {
  categories: BusinessCategory[];
  onCreate: (data: { name: string; color: string }) => void;
  onUpdate: (id: string, data: { name: string; color: string }) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

// Preset colors for categories
const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#ef4444", // Red
  "#6366f1", // Indigo
  "#84cc16", // Lime
];

export function CategoryList({
  categories,
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
    color: PRESET_COLORS[0],
  });

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", color: PRESET_COLORS[0] });
  };

  // Open create dialog
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (category: BusinessCategory) => {
    setFormData({ name: category.name, color: category.color || PRESET_COLORS[0] });
    setEditingCategory(category);
  };

  // Handle create
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onCreate({ name: formData.name.trim(), color: formData.color });
    setIsCreateOpen(false);
    resetForm();
  };

  // Handle update
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    onUpdate(editingCategory.id, {
      name: formData.name.trim(),
      color: formData.color,
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
          <p className="text-sm text-slate-500">
            {t("categories.subtitle")}
          </p>
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

      {/* Categories Grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={cn(
                "group relative p-4 bg-white rounded-card-lg",
                "border border-slate-100 shadow-card-sm",
                "hover:shadow-card transition-all duration-200"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Color indicator */}
                <div
                  className="w-10 h-10 rounded-card flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Tag
                    className="w-5 h-5"
                    style={{ color: category.color }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">
                    {category.name}
                  </h4>
                  {category.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </div>
            </div>
          ))}
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("categories.namePlaceholder")}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>{t("categories.color")}</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color }))
                    }
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
                disabled={isLoading || !formData.name.trim()}
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
                placeholder={t("categories.name")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("categories.color")}</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color }))
                    }
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
                disabled={isLoading || !formData.name.trim()}
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
              {deletingCategory && t("categories.deleteDescription", { name: deletingCategory.name })}
              {deletingCategory && (
                <p className="mt-2 text-amber-600">
                  {t("categories.deleteWarning")}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{tCommon("buttons.cancel")}</AlertDialogCancel>
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
