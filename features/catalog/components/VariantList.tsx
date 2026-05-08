"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Plus, AlertTriangle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  | { type: "edit"; variant: ProductVariant }
  | { type: "delete"; variant: ProductVariant }
  | null;

export function VariantList({ productId, businessId, schema }: VariantListProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [pendingLabel, setPendingLabel] = useState("");
  const [pendingPrice, setPendingPrice] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);

  const { data: variants = [], isLoading } = useVariants(businessId, productId);
  const createVariant = useCreateVariant(businessId, productId);
  const updateVariant = useUpdateVariant(businessId, productId);
  const deleteVariant = useDeleteVariant(businessId, productId);

  const activeCount = variants.filter((v) => v.isActive).length;

  // Focus label input when inline create opens
  useEffect(() => {
    if (showInlineCreate) {
      setTimeout(() => labelInputRef.current?.focus(), 50);
    }
  }, [showInlineCreate]);

  const openInlineCreate = () => {
    setPendingLabel("");
    setPendingPrice("");
    setShowInlineCreate(true);
  };

  const cancelInlineCreate = () => {
    setShowInlineCreate(false);
    setPendingLabel("");
    setPendingPrice("");
  };

  const handleInlineCreate = () => {
    const label = pendingLabel.trim();
    const price = parseFloat(pendingPrice);
    if (!label || isNaN(price) || price <= 0) return;

    createVariant.mutate(
      { variantLabel: label, price, isActive: true, isDefault: variants.length === 0 },
      {
        onSuccess: () => {
          setPendingLabel("");
          setPendingPrice("");
          // Keep inline form open so user can add more
          setTimeout(() => labelInputRef.current?.focus(), 50);
        },
      }
    );
  };

  const handleToggleActive = (variant: ProductVariant) => {
    updateVariant.mutate({
      variantId: variant.id,
      dto: { isActive: !variant.isActive },
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

  const canAdd =
    pendingLabel.trim() !== "" &&
    pendingPrice !== "" &&
    parseFloat(pendingPrice) > 0;

  return (
    <div className="space-y-3">
      {/* List */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-4 text-center">Cargando variantes...</p>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
            >
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

              <Switch
                checked={variant.isActive}
                onCheckedChange={() => handleToggleActive(variant)}
                disabled={updateVariant.isPending}
                aria-label={`Activar/desactivar ${variant.variantLabel}`}
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() => setDialogMode({ type: "edit", variant })}
                aria-label={`Editar ${variant.variantLabel}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>

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

          {/* Inline create row */}
          {showInlineCreate && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-200">
              <Input
                ref={labelInputRef}
                value={pendingLabel}
                onChange={(e) => setPendingLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleInlineCreate(); }
                  if (e.key === "Escape") cancelInlineCreate();
                }}
                placeholder="Etiqueta (ej: 500ml, Talla M…)"
                className="flex-1 h-8 text-sm"
                disabled={createVariant.isPending}
              />
              <div className="relative w-28 shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                  $
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={pendingPrice}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setPendingPrice(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleInlineCreate(); }
                    if (e.key === "Escape") cancelInlineCreate();
                  }}
                  placeholder="Precio"
                  className="pl-5 h-8 text-sm"
                  disabled={createVariant.isPending}
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleInlineCreate}
                disabled={!canAdd || createVariant.isPending}
                isLoading={createVariant.isPending}
                aria-label="Agregar variante"
              >
                {!createVariant.isPending && <Check className="h-4 w-4" />}
              </Button>
              <button
                type="button"
                onClick={cancelInlineCreate}
                className="flex items-center justify-center h-8 w-8 shrink-0 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Add row trigger */}
          {!showInlineCreate && (
            <button
              type="button"
              onClick={openInlineCreate}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva variante
            </button>
          )}
        </div>
      )}

      {/* Empty state with inline trigger */}
      {!isLoading && variants.length === 0 && !showInlineCreate && (
        <button
          type="button"
          onClick={openInlineCreate}
          className="flex items-center gap-2 w-full px-4 py-3 text-sm text-indigo-600 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar primera variante
        </button>
      )}

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
              disabled={deleteVariant.isPending || !!willLeaveZeroActive}
              isLoading={deleteVariant.isPending}
              title={
                willLeaveZeroActive
                  ? "No es posible eliminar la última variante activa del producto"
                  : undefined
              }
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
