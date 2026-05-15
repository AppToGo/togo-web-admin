"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditImportItemDrawer } from "./EditImportItemDrawer";
import { DeleteImportItemDialog } from "./DeleteImportItemDialog";
import { useUpdateImportItem, useDeleteImportItem } from "../hooks/useImportMutations";
import type { ImportItem, UpdateImportItemDto } from "../types/import.types";

interface DetectedProductsTableProps {
  businessId: string;
  jobId: string;
  items: ImportItem[];
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

function formatPrice(price: number | null): string {
  if (price === null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export function DetectedProductsTable({
  businessId,
  jobId,
  items,
  onSelectionChange,
}: DetectedProductsTableProps) {
  const t = useTranslations("catalog.import.review");
  const [editingItem, setEditingItem] = useState<ImportItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ImportItem | null>(null);

  const updateMutation = useUpdateImportItem(businessId, jobId);
  const deleteMutation = useDeleteImportItem(businessId, jobId);

  const handleToggleSelect = (item: ImportItem) => {
    updateMutation.mutate({ itemId: item.id, dto: { isSelected: !item.isSelected } });
  };

  const handleSaveEdit = (itemId: string, dto: UpdateImportItemDto) => {
    updateMutation.mutate(
      { itemId, dto },
      { onSuccess: () => setEditingItem(null) }
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteMutation.mutate(deletingItem.id, {
      onSuccess: () => setDeletingItem(null),
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        {t("noProducts")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-10 px-3 py-3 text-left">
                <span className="sr-only">{t("columns.name")}</span>
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600">
                {t("columns.name")}
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600">
                {t("columns.price")}
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600">
                {t("columns.category")}
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600">
                {t("columns.suggestion")}
              </th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={!item.isSelected ? "opacity-50 bg-slate-50" : "bg-white"}
              >
                <td className="px-3 py-3">
                  <Checkbox
                    checked={item.isSelected}
                    onCheckedChange={() => handleToggleSelect(item)}
                    disabled={updateMutation.isPending}
                  />
                </td>
                <td className="px-3 py-3">
                  <span className="font-medium text-slate-900">{item.name}</span>
                  {item.description && (
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {item.description}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-700">
                  {formatPrice(item.price)}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.rawCategory ?? "-"}
                </td>
                <td className="px-3 py-3">
                  {item.suggestedGlobalProductName ? (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs text-slate-700 truncate max-w-[140px]">
                        {item.suggestedGlobalProductName}
                      </span>
                      {item.matchScore !== null && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0 shrink-0"
                        >
                          {Math.round(item.matchScore * 100)}%
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                      onClick={() => setDeletingItem(item)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditImportItemDrawer
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
        isSaving={updateMutation.isPending}
      />

      <DeleteImportItemDialog
        itemName={deletingItem?.name ?? null}
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
