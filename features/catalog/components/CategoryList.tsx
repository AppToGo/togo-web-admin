"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CategoriesMobileList } from "./mobile/CategoriesMobileList";
import { useTranslations } from "next-intl";
import { Plus, Folder, Tags, AlertCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillGroup } from "@/components/ui/pill-group";
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
import { CategoryCard } from "./CategoryCard";
import { CategoryFilters } from "./CategoryFilters";
import { KeywordsInput } from "@/components/ui/keywords-input";
import { EDITABLE_KEYWORD_SOURCES } from "../types/catalog.types";
import type { BusinessCategory, CategoryFilters as CategoryFiltersType, KeywordEntry } from "../types/catalog.types";

const STATUS_FILTERS = ["all", "active", "inactive"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const STATUS_FILTER_VALUE: Record<StatusFilter, boolean | null> = {
  all: null,
  active: true,
  inactive: false,
};

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
    order?: number;
    searchKeywords?: KeywordEntry[];
  }) => void;
  onUpdate: (
    id: string,
    data: {
      name: string;
      slug: string;
      industryCategoryId: string;
      description?: string;
      order?: number;
      searchKeywords?: KeywordEntry[];
    }
  ) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onRegenerateKeywords?: (id: string) => void;
  isRegeneratingKeywords?: boolean;
  isLoading?: boolean;
}

export function CategoryList({
  categories,
  industryCategories,
  onCreate,
  onUpdate,
  onDelete,
  onToggleStatus,
  onRegenerateKeywords,
  isRegeneratingKeywords,
  isLoading = false,
}: CategoryListProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");

  // Filters state
  const [filters, setFilters] = useState<CategoryFiltersType>({
    name: "",
    isActive: null,
    industryCategoryId: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  // Id only, not the object — the object is derived from `categories` below
  // so "Regenerar con IA" (which invalidates that query) is reflected in an
  // already-open modal instead of requiring a close/reopen.
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [deletingCategory, setDeletingCategory] =
    useState<BusinessCategory | null>(null);
  const editingCategory = editingCategoryId
    ? (categories.find((c) => c.id === editingCategoryId) ?? null)
    : null;
  const isEditing = !!editingCategory;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    industryCategoryId: "",
    description: "",
    order: 0,
  });
  const [searchKeywords, setSearchKeywords] = useState<KeywordEntry[]>([]);

  // handleOpenEdit sets the initial value synchronously (avoids a one-frame
  // flash of empty chips); this re-syncs it afterward when editingCategory's
  // keywords change externally (e.g. AI regeneration finishing). Ajuste de
  // estado durante el render en vez de un efecto.
  const externalKeywords = editingCategory?.searchKeywords;
  const [syncedKeywords, setSyncedKeywords] = useState<
    typeof externalKeywords | null
  >(null);
  if (externalKeywords !== syncedKeywords) {
    setSyncedKeywords(externalKeywords);
    if (externalKeywords) setSearchKeywords(externalKeywords);
  }

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

  // Calculate active filters count
  const activeFiltersCount =
    (filters.name ? 1 : 0) +
    (filters.isActive !== null ? 1 : 0) +
    (filters.industryCategoryId ? 1 : 0);

  // Pastillas de estado: misma fuente que el switch del popover de filtros.
  const statusFilter: StatusFilter =
    filters.isActive === true ? "active" : filters.isActive === false ? "inactive" : "all";
  const activeCount = categories.filter((c) => c.isActive).length;
  const statusCounts: Record<StatusFilter, number> = {
    all: categories.length,
    active: activeCount,
    inactive: categories.length - activeCount,
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: "",
      isActive: null,
      industryCategoryId: "",
    });
  };

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
      order: 0,
    });
    setSearchKeywords([]);
  };

  // Open create dialog
  const handleOpenCreate = () => {
    resetForm();
    setEditingCategoryId(null);
    setIsModalOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (category: BusinessCategory) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      industryCategoryId: category.industryCategoryId,
      description: category.description || "",
      order: category.order ?? 0,
    });
    setSearchKeywords(category.searchKeywords ?? []);
    setEditingCategoryId(category.id);
    setIsModalOpen(true);
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

  // Handle submit (create or update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.slug.trim() ||
      !formData.industryCategoryId
    )
      return;

    // El backend recalcula las heredadas (categoría de industria, nombre) —
    // solo se envían las entradas que el usuario controla directamente.
    const editableKeywords = searchKeywords.filter((k) =>
      EDITABLE_KEYWORD_SOURCES.includes(k.source)
    );

    if (isEditing && editingCategory) {
      onUpdate(editingCategory.id, {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        industryCategoryId: formData.industryCategoryId,
        description: formData.description.trim() || undefined,
        order: formData.order,
        searchKeywords: editableKeywords,
      });
    } else {
      onCreate({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        industryCategoryId: formData.industryCategoryId,
        description: formData.description.trim() || undefined,
        order: formData.order,
        searchKeywords: editableKeywords,
      });
    }
    closeModal();
  };

  // Close modal and reset
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategoryId(null);
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

  // Teléfono: tarjetas con buscador (diseño móvil); el diálogo de crear y
  // editar es el mismo.
  const list = isMobile ? (
    <CategoriesMobileList
      categories={filteredCategories}
      search={filters.name ?? ""}
      onSearchChange={(name) => setFilters({ ...filters, name })}
      onEdit={handleOpenEdit}
      onCreate={handleOpenCreate}
    />
  ) : null;

  return (
    <div className="space-y-6">
      {list}
      {!isMobile && (<>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Tags className="h-6 w-6 text-indigo-600" />
            {t("categories.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("categories.pageSubtitle")}</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isLoading} className="h-11 rounded-card px-5">
          <Plus className="h-4 w-4" />
          {t("categories.new")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CategoryFilters
          filters={filters}
          onFiltersChange={setFilters}
          industryCategories={industryCategories}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={clearFilters}
        />
        <PillGroup
          label={tCommon("fields.status")}
          value={statusFilter}
          onChange={(status) =>
            setFilters({ ...filters, isActive: STATUS_FILTER_VALUE[status] })
          }
          appearance="glass"
          className="sm:order-first"
          options={STATUS_FILTERS.map((status) => ({
            id: status,
            label: t(`categories.statusFilter.${status}`),
            count: statusCounts[status],
          }))}
        />
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center rounded-card-xl border border-white/80 bg-white/45 px-4 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Folder className="h-8 w-8 text-indigo-500" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            {t("categories.noCategories")}
          </h2>
          <p className="mb-4 max-w-sm text-sm text-slate-500">
            {t("categories.emptyDescription")}
          </p>
          <Button onClick={handleOpenCreate} variant="slate-outline">
            <Plus className="h-4 w-4" />
            {t("categories.createFirst")}
          </Button>
        </div>
      )}

      {categories.length > 0 && filteredCategories.length === 0 && (
        <div className="flex flex-col items-center rounded-card-xl border border-white/80 bg-white/45 px-4 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Search className="h-8 w-8 text-indigo-500" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            {t("categories.noResults")}
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            {t("categories.noResultsDescription")}
          </p>
          <Button onClick={clearFilters} variant="slate-outline">
            <X className="h-4 w-4" />
            {tCommon("filters.clear")}
          </Button>
        </div>
      )}

      {filteredCategories.length > 0 && (
        <ul
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          data-testid="categories-grid"
        >
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              industryCategoryName={
                category.industryCategoryName ||
                industryCategories.find((ic) => ic.id === category.industryCategoryId)
                  ?.name
              }
              onEdit={handleOpenEdit}
              onDelete={setDeletingCategory}
              onToggleStatus={handleToggleStatus}
              onRegenerateKeywords={onRegenerateKeywords}
              isRegeneratingKeywords={isRegeneratingKeywords}
            />
          ))}
        </ul>
      )}
      </>)}

      {/* Create/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("categories.edit") : t("categories.new")}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t("categories.editDescription")
                : t("categories.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-7">
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
                disabled={isLoading || isEditing}
              />
              <p className="text-xs text-slate-500">
                {t("categories.slugHelp")}
              </p>
              {isEditing && (
                <p className="text-xs text-amber-600">
                  {t("categories.slugDisabled")}
                </p>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="category-order">
                {t("categories.orderLabel")}
              </Label>
              <Input
                id="category-order"
                type="number"
                min={0}
                step={1}
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  }))
                }
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                {t("categories.orderHelp")}
              </p>
            </div>

            <KeywordsInput
              value={searchKeywords}
              onChange={setSearchKeywords}
              label={t("categories.form.keywordsLabel")}
              placeholder={t("categories.form.keywordsPlaceholder")}
              helperText={t("categories.form.keywordsHelp")}
              disabled={isLoading}
              onRegenerateAi={
                isEditing && editingCategory
                  ? () => onRegenerateKeywords?.(editingCategory.id)
                  : undefined
              }
              isRegenerating={isRegeneratingKeywords}
              regenerateLabel={t("categories.form.keywordsRegenerate")}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
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
                {isEditing
                  ? tCommon("buttons.saveChanges")
                  : t("categories.create")}
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
