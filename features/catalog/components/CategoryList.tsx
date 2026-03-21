"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Folder, Tag, AlertCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { CategoryActions } from "./CategoryActions";
import type { BusinessCategory, CategoryFilters } from "../types/catalog.types";

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
  onToggleStatus: (id: string, isActive: boolean) => void;
  isLoading?: boolean;
}

export function CategoryList({
  categories,
  industryCategories,
  onCreate,
  onUpdate,
  onDelete,
  onToggleStatus,
  isLoading = false,
}: CategoryListProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");

  // Filters state
  const [filters, setFilters] = useState<CategoryFilters>({
    name: "",
    isActive: null,
    industryCategoryId: "",
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<BusinessCategory | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<BusinessCategory | null>(null);
  const isEditing = !!editingCategory;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    industryCategoryId: "",
    description: "",
  });

  // Filter categories locally
  const filteredCategories = categories.filter((cat) => {
    const matchesName =
      !filters.name ||
      cat.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesStatus =
      filters.isActive === null || filters.isActive === undefined
        ? true
        : cat.isActive === filters.isActive;
    const matchesIndustry =
      !filters.industryCategoryId ||
      cat.industryCategoryId === filters.industryCategoryId;
    return matchesName && matchesStatus && matchesIndustry;
  });

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: "",
      isActive: null,
      industryCategoryId: "",
    });
  };

  // Check if any filter is active
  const hasActiveFilters =
    filters.name || filters.isActive !== null || filters.industryCategoryId;

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const newFormData = { ...formData, name };
    if (!isEditing) {
      const expectedSlug = generateSlug(formData.name);
      if (!formData.slug || formData.slug === expectedSlug) {
        newFormData.slug = generateSlug(name);
      }
    }
    setFormData(newFormData);
  };

  // Handle create
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.slug.trim() ||
      !formData.industryCategoryId
    )
      return;

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

  // Handle toggle status
  const handleToggleStatus = (category: BusinessCategory) => {
    onToggleStatus(category.id, !category.isActive);
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

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-4">
        {/* Name filter */}
        <div className="flex flex-col col-span-2">
          <Label
            htmlFor="filter-name"
            className="text-sm font-medium text-slate-700 mb-1.5 block"
          >
            {tCommon("fields.name")}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="filter-name"
              value={filters.name}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={tCommon("search.placeholder")}
              className="pl-9"
            />
          </div>
        </div>

        <div className="col-span-3 gap-4 flex items-end">
          {/* Status filter */}
          <div className="flex-1 flex-col">
            <Label
              htmlFor="filter-status"
              className="text-sm font-medium text-slate-700 mb-1.5 block"
            >
              {tCommon("fields.status")}
            </Label>
            <Select
              value={
                filters.isActive === null || filters.isActive === undefined
                  ? "all"
                  : filters.isActive.toString()
              }
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: value === "all" ? null : value === "true",
                }))
              }
            >
              <SelectTrigger id="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("filters.all")}</SelectItem>
                <SelectItem value="true">{tCommon("status.active")}</SelectItem>
                <SelectItem value="false">
                  {tCommon("status.inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Industry Category filter */}
          <div className="flex-1 flex-col">
            <Label
              htmlFor="filter-industry"
              className="text-sm font-medium text-slate-700 mb-1.5 block"
            >
              {t("categories.industryCategory")}
            </Label>
            <Select
              value={filters.industryCategoryId || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  industryCategoryId: value === "all" ? "" : value,
                }))
              }
            >
              <SelectTrigger id="filter-industry">
                <SelectValue
                  placeholder={t("categories.selectIndustryCategory")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("filters.all")}</SelectItem>
                {industryCategories.map((ic) => (
                  <SelectItem key={ic.id} value={ic.id}>
                    {ic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-40 h-10 flex-none"
            >
              <X className="w-4 h-4 mr-1" />
              {tCommon("filters.clear")}
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-slate-500 pt-1 pl-2">
          {filteredCategories.length}{" "}
          {filteredCategories.length === 1
            ? t("categories.result")
            : t("categories.results")}
        </div>
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

      {/* No results after filtering */}
      {categories.length > 0 && filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-card-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-medium text-slate-900 mb-2">
            {t("categories.noResults")}
          </h4>
          <p className="text-sm text-slate-500 mb-4">
            {t("categories.noResultsDescription")}
          </p>
          <Button onClick={clearFilters} variant="outline">
            <X className="w-4 h-4 mr-2" />
            {tCommon("filters.clear")}
          </Button>
        </div>
      )}

      {/* Categories Table */}
      {filteredCategories.length > 0 && (
        <Card>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-slate-500">
                    {tCommon("fields.name")}
                  </TableHead>
                  <TableHead className="text-slate-500">Slug</TableHead>
                  <TableHead className="text-slate-500">
                    {t("categories.industryCategory")}
                  </TableHead>
                  <TableHead className="text-center text-slate-500">
                    {tCommon("fields.status")}
                  </TableHead>
                  <TableHead className="text-right text-slate-500">
                    {tCommon("fields.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow
                    key={category.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Name */}
                    <TableCell>
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
                    </TableCell>

                    {/* Slug */}
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>

                    {/* Industry Category */}
                    <TableCell>
                      <span className="text-slate-600">
                        {category.industryCategoryName ||
                          industryCategories.find(
                            (ic) => ic.id === category.industryCategoryId
                          )?.name ||
                          category.industryCategoryId}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          category.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {category.isActive
                          ? tCommon("status.active")
                          : tCommon("status.inactive")}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <CategoryActions
                        category={category}
                        onEdit={handleOpenEdit}
                        onDelete={setDeletingCategory}
                        onToggleStatus={handleToggleStatus}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
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

          <form onSubmit={handleCreate} className="space-y-4 mt-4 p-7">
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
                  setFormData((prev) => ({
                    ...prev,
                    industryCategoryId: value,
                  }))
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
                  setFormData((prev) => ({
                    ...prev,
                    industryCategoryId: value,
                  }))
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
                t("categories.deleteDescription", {
                  name: deletingCategory.name,
                })}
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
