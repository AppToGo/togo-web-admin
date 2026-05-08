"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VariantForm } from "./VariantForm";
import {
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "../hooks/useCatalog";
import type {
  ProductVariant,
  AttributeSchema,
  CreateVariantDto,
  UpdateVariantDto,
} from "../types/catalog.types";

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface VariantListProps {
  productId: string;
  businessId: string;
  schema?: AttributeSchema;
}

type DialogMode =
  | { type: "create" }
  | { type: "edit"; variant: ProductVariant }
  | { type: "delete"; variant: ProductVariant }
  | null;

export function VariantList({ productId, businessId, schema }: VariantListProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const { data: variants = [], isLoading } = useVariants(businessId, productId);
  const createVariant = useCreateVariant(businessId, productId);
  const updateVariant = useUpdateVariant(businessId, productId);
  const deleteVariant = useDeleteVariant(businessId, productId);

  const activeCount = variants.filter((v) => v.isActive).length;

  const handleToggleActive = (variant: ProductVariant) => {
    updateVariant.mutate({
      variantId: variant.id,
      dto: { isActive: !variant.isActive },
    });
  };

  const handleCreate = (dto: CreateVariantDto | UpdateVariantDto) => {
    createVariant.mutate(dto as CreateVariantDto, {
      onSuccess: () => setDialogMode(null),
    });
  };

  const handleEdit = (dto: CreateVariantDto | UpdateVariantDto) => {
    if (dialogMode?.type !== "edit") return;
    updateVariant.mutate(
      { variantId: dialogMode.variant.id, dto: dto as UpdateVariantDto },
      { onSuccess: () => setDialogMode(null) }
    );
  };

  const handleDelete = () => {
    if (dialogMode?.type !== "delete") return;
    deleteVariant.mutate(dialogMode.variant.id, {
      onSuccess: () => setDialogMode(null),
    });
  };

  const deletingVariant =
    dialogMode?.type === "delete" ? dialogMode.variant : null;
  const willLeaveZeroActive =
    deletingVariant?.isActive && activeCount === 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Variantes ({variants.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setDialogMode({ type: "create" })}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nueva variante
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-4 text-center">Cargando variantes...</p>
      ) : variants.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          No hay variantes. Crea la primera.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
            >
              {/* Label + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {variant.variantLabel}
                  </span>
                  {variant.isDefault && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200">
                      Por defecto
                    </Badge>
                  )}
                  {!variant.isActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Inactiva
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatCOP(variant.price)}</p>
              </div>

              {/* Active toggle */}
              <Switch
                checked={variant.isActive}
                onCheckedChange={() => handleToggleActive(variant)}
                disabled={updateVariant.isPending}
                aria-label={`Activar/desactivar ${variant.variantLabel}`}
              />

              {/* Edit */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDialogMode({ type: "edit", variant })}
                aria-label={`Editar ${variant.variantLabel}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {/* Delete */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDialogMode({ type: "delete", variant })}
                aria-label={`Eliminar ${variant.variantLabel}`}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog
        open={dialogMode?.type === "create"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva variante</DialogTitle>
          </DialogHeader>
          <VariantForm
            schema={schema}
            onSubmit={handleCreate}
            onCancel={() => setDialogMode(null)}
            isLoading={createVariant.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={dialogMode?.type === "edit"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar variante</DialogTitle>
          </DialogHeader>
          {dialogMode?.type === "edit" && (
            <VariantForm
              variant={dialogMode.variant}
              schema={schema}
              onSubmit={handleEdit}
              onCancel={() => setDialogMode(null)}
              isLoading={updateVariant.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogMode?.type === "delete"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar variante</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar{" "}
              <strong>{deletingVariant?.variantLabel}</strong>? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {willLeaveZeroActive && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 mx-6 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Al eliminar esta variante el producto quedará sin variantes
                activas.
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogMode(null)}
              disabled={deleteVariant.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteVariant.isPending}
              isLoading={deleteVariant.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
