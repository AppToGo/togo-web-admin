"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Tags,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
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
import { useIndustries } from "@/features/admin/catalog/hooks";
import {
  useIndustryCategories,
  useCreateIndustryCategory,
  useUpdateIndustryCategory,
  useDeleteIndustryCategory,
  useToggleIndustryCategoryStatus,
  type IndustryCategory,
  type CreateIndustryCategoryDto,
  IndustryCategoryDialog,
  IndustryCategoryList,
} from "@/features/admin/industry-categories";

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  variant?: "default" | "success" | "danger";
}

function StatCard({
  title,
  value,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    danger: "bg-red-50 border-red-200",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div
          className={
            variant === "success"
              ? "text-emerald-600"
              : variant === "danger"
                ? "text-red-600"
                : "text-indigo-600"
          }
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function IndustryCategoriesPage() {
  useAuthGuard();
  const t = useTranslations("admin-industry-categories");
  const isSuperAdmin = useIsSuperAdmin();

  // ============================================================================
  // STATE
  // ============================================================================

  const [filters, setFilters] = useState<{
    industryIds?: string[];
    includeInactive?: boolean;
  }>({
    includeInactive: false,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<IndustryCategory | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<IndustryCategory | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: industries = [] } = useIndustries();
  const { data: categories = [], isLoading } = useIndustryCategories(filters);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Industry options for multi-select filter
  const industryOptions = useMemo(() => {
    return industries.map((ind) => ({
      value: ind.id,
      label: ind.name,
    }));
  }, [industries]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createCategory = useCreateIndustryCategory();
  const updateCategory = useUpdateIndustryCategory();
  const deleteCategory = useDeleteIndustryCategory();
  const toggleStatus = useToggleIndustryCategoryStatus();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: IndustryCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (category: IndustryCategory) => {
    setDeletingCategory(category);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteCategory.mutate(deletingCategory.id, {
        onSuccess: () => setDeletingCategory(null),
      });
    }
  };

  const handleToggleStatus = (category: IndustryCategory) => {
    toggleStatus.mutate({
      id: category.id,
      isActive: !category.isActive,
    });
  };

  const handleSubmit = (data: CreateIndustryCategoryDto) => {
    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingCategory(null);
          },
        }
      );
    } else {
      createCategory.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = {
    total: filteredCategories.length,
    active: filteredCategories.filter((c) => c.isActive).length,
    inactive: filteredCategories.filter((c) => !c.isActive).length,
  };

  // ============================================================================
  // ACCESS CHECK
  // ============================================================================

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("accessDenied.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("accessDenied.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("page.title")}
            </h1>
            <p className="text-slate-500 mt-1">{t("page.description")}</p>
          </div>
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            {t("buttons.newCategory")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t("stats.total")}
            value={stats.total}
            icon={<Tags className="w-5 h-5" />}
            variant="default"
          />
          <StatCard
            title={t("stats.active")}
            value={stats.active}
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="success"
          />
          <StatCard
            title={t("stats.inactive")}
            value={stats.inactive}
            icon={<XCircle className="w-5 h-5" />}
            variant="danger"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1 sm:max-w-xs">
            <MultiSelect
              options={industryOptions}
              value={filters.industryIds || []}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  industryIds: value.length > 0 ? value : undefined,
                }))
              }
              placeholder={t("filters.allIndustries")}
              searchPlaceholder={t("filters.searchIndustries")}
              maxDisplay={2}
            />
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Switch
              id="show-inactive"
              checked={filters.includeInactive}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  includeInactive: checked,
                }))
              }
            />
            <Label
              htmlFor="show-inactive"
              className="text-sm text-slate-600 cursor-pointer"
            >
              {t("filters.showInactive")}
            </Label>
          </div>
        </div>

        {/* List */}
        <Card>
          <IndustryCategoryList
            categories={filteredCategories}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </Card>

        {/* Create/Edit Dialog */}
        <IndustryCategoryDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          category={editingCategory}
          industries={industries}
          onSubmit={handleSubmit}
          isSubmitting={createCategory.isPending || updateCategory.isPending}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteDialog.description", {
                  name: deletingCategory?.name || "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteCategory.isPending
                  ? t("buttons.deleting")
                  : t("buttons.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
