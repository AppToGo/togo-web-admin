"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Plus, AlertTriangle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useIndustryCategoryVariantTemplates,
} from "../hooks/useCatalog";
import type {
  ProductVariant,
  AttributeSchema,
  CreateVariantDto,
} from "../types/catalog.types";

const SELECT_NONE = "__none__" as const;
const UNIDAD_ID = "__unidad__" as const;

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
  industryCategoryId?: string | null;
}

interface InlineEditState {
  variantId: string;
  templateId: string; // UNIDAD_ID or template.id
  label: string;      // resolved label (read-only after selection)
  price: string;
}

export function VariantList({ productId, businessId, schema: _schema, industryCategoryId }: VariantListProps) {
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState("");
  const [pendingPrice, setPendingPrice] = useState("");

  const editPriceRef = useRef<HTMLInputElement>(null);
  const createPriceRef = useRef<HTMLInputElement>(null);

  const { data: variants = [], isLoading } = useVariants(businessId, productId);
  const { data: templates = [], isLoading: loadingTemplates } =
    useIndustryCategoryVariantTemplates(industryCategoryId ?? null);

  const usedLabels = new Set(variants.map((v) => v.variantLabel.toLowerCase()));

  // For create: exclude all used labels
  const availableTemplates = templates.filter(
    (t) => !usedLabels.has(t.label.toLowerCase())
  );

  // For edit: exclude labels used by OTHER variants (allow own label)
  const editingVariantLabel = inlineEdit
    ? variants.find((v) => v.id === inlineEdit.variantId)?.variantLabel.toLowerCase()
    : undefined;
  const availableEditTemplates = templates.filter(
    (t) => !usedLabels.has(t.label.toLowerCase()) || t.label.toLowerCase() === editingVariantLabel
  );

  const createVariant = useCreateVariant(businessId, productId);
  const updateVariant = useUpdateVariant(businessId, productId);
  const deleteVariant = useDeleteVariant(businessId, productId);

  const activeCount = variants.filter((v) => v.isActive).length;

  // Focus price when template selected in create row
  useEffect(() => {
    if (pendingTemplateId) {
      setTimeout(() => createPriceRef.current?.focus(), 50);
    }
  }, [pendingTemplateId]);

  // Focus price when edit row opens
  useEffect(() => {
    if (inlineEdit) {
      setTimeout(() => editPriceRef.current?.focus(), 50);
    }
  }, [inlineEdit?.variantId]);

  // ─── Inline edit ────────────────────────────────────────────────────────────

  const openInlineEdit = (variant: ProductVariant) => {
    setShowInlineCreate(false);
    const isUnidad = variant.variantLabel.toLowerCase() === "unidad";
    const matchedTemplate = templates.find(
      (t) => t.label.toLowerCase() === variant.variantLabel.toLowerCase()
    );
    setInlineEdit({
      variantId: variant.id,
      templateId: isUnidad ? UNIDAD_ID : (matchedTemplate?.id ?? UNIDAD_ID),
      label: variant.variantLabel,
      price: variant.price.toString(),
    });
  };

  const cancelInlineEdit = () => setInlineEdit(null);

  const confirmInlineEdit = () => {
    if (!inlineEdit) return;
    const price = parseFloat(inlineEdit.price);
    if (!inlineEdit.templateId || !inlineEdit.label.trim() || isNaN(price) || price <= 0) return;

    updateVariant.mutate(
      {
        variantId: inlineEdit.variantId,
        dto: { variantLabel: inlineEdit.label.trim(), price },
      },
      { onSuccess: () => setInlineEdit(null) }
    );
  };

  // ─── Inline create ──────────────────────────────────────────────────────────

  const openInlineCreate = () => {
    setInlineEdit(null);
    setPendingTemplateId("");
    setPendingPrice("");
    setShowInlineCreate(true);
  };

  const cancelInlineCreate = () => {
    setShowInlineCreate(false);
    setPendingTemplateId("");
    setPendingPrice("");
  };

  const handleInlineCreate = () => {
    const price = parseFloat(pendingPrice);
    if (!pendingTemplateId || isNaN(price) || price <= 0) return;

    const isUnidad = pendingTemplateId === UNIDAD_ID;
    const template = isUnidad
      ? { label: "Unidad", attributes: {} as Record<string, string | number> }
      : templates.find((t) => t.id === pendingTemplateId);
    if (!template) return;

    const dto: CreateVariantDto = {
      variantLabel: template.label,
      price,
      attributes: Object.keys(template.attributes).length > 0 ? template.attributes : undefined,
      isActive: true,
      isDefault: variants.length === 0,
    };

    createVariant.mutate(dto, {
      onSuccess: () => {
        setPendingTemplateId("");
        setPendingPrice("");
      },
    });
  };

  // ─── Toggle & delete ─────────────────────────────────────────────────────────

  const handleToggleActive = (variant: ProductVariant) => {
    updateVariant.mutate({ variantId: variant.id, dto: { isActive: !variant.isActive } });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteVariant.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const willLeaveZeroActive = deleteTarget?.isActive && activeCount === 1;

  const canAdd =
    pendingTemplateId !== "" &&
    pendingPrice !== "" &&
    parseFloat(pendingPrice) > 0;

  const canConfirmEdit =
    !!inlineEdit &&
    inlineEdit.templateId !== "" &&
    inlineEdit.label.trim() !== "" &&
    inlineEdit.price !== "" &&
    parseFloat(inlineEdit.price) > 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-slate-400 py-4 text-center">Cargando variantes...</p>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
          {variants.map((variant) => {
            const isEditingThis = inlineEdit?.variantId === variant.id;

            if (isEditingThis && inlineEdit) {
              // ── Inline edit row ──────────────────────────────────────────
              return (
                <div key={variant.id} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50">
                  <Select
                    value={inlineEdit.templateId || SELECT_NONE}
                    onValueChange={(v) => {
                      if (v === SELECT_NONE) return;
                      const isUnidad = v === UNIDAD_ID;
                      const tpl = isUnidad ? null : templates.find((t) => t.id === v);
                      const label = isUnidad ? "Unidad" : (tpl?.label ?? "");
                      setInlineEdit((s) => s && ({ ...s, templateId: v, label }));
                      setTimeout(() => editPriceRef.current?.focus(), 50);
                    }}
                    disabled={updateVariant.isPending}
                  >
                    <SelectTrigger className="flex-1 h-8 text-sm bg-white">
                      <SelectValue placeholder="Seleccioná variante" />
                    </SelectTrigger>
                    <SelectContent>
                      {(!usedLabels.has("unidad") || editingVariantLabel === "unidad") && (
                        <SelectItem value={UNIDAD_ID}>Unidad</SelectItem>
                      )}
                      {availableEditTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">$</span>
                    <Input
                      ref={editPriceRef}
                      type="text"
                      inputMode="decimal"
                      value={inlineEdit.price}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d*\.?\d*$/.test(v))
                          setInlineEdit((s) => s && ({ ...s, price: v }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); confirmInlineEdit(); }
                        if (e.key === "Escape") cancelInlineEdit();
                      }}
                      placeholder="Precio"
                      className="pl-5 h-8 text-sm bg-white"
                      disabled={updateVariant.isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={confirmInlineEdit}
                    disabled={!canConfirmEdit || updateVariant.isPending}
                    isLoading={updateVariant.isPending}
                    aria-label="Guardar"
                  >
                    {!updateVariant.isPending && <Check className="h-4 w-4" />}
                  </Button>
                  <button
                    type="button"
                    onClick={cancelInlineEdit}
                    className="flex items-center justify-center h-8 w-8 shrink-0 text-slate-400 hover:text-slate-600 rounded-md hover:bg-indigo-100 transition-colors"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            }

            // ── Normal row ───────────────────────────────────────────────
            return (
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

                <button
                  type="button"
                  onClick={() => openInlineEdit(variant)}
                  className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 border border-slate-200 transition-colors"
                  aria-label={`Editar ${variant.variantLabel}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(variant)}
                  className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 border border-slate-200 transition-colors"
                  aria-label={`Eliminar ${variant.variantLabel}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* Inline create row */}
          {showInlineCreate && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50">
              {!industryCategoryId ? (
                <p className="flex-1 text-xs text-amber-700">
                  Seleccioná una categoría para agregar variantes.
                </p>
              ) : loadingTemplates ? (
                <p className="flex-1 text-xs text-slate-400">Cargando variantes…</p>
              ) : availableTemplates.length === 0 && usedLabels.has("unidad") ? (
                <p className="flex-1 text-xs text-slate-500">
                  Todas las variantes de esta categoría ya fueron agregadas.
                </p>
              ) : (
                <>
                  <Select
                    value={pendingTemplateId || SELECT_NONE}
                    onValueChange={(v) => setPendingTemplateId(v === SELECT_NONE ? "" : v)}
                    disabled={createVariant.isPending}
                  >
                    <SelectTrigger className="flex-1 h-8 text-sm">
                      <SelectValue placeholder="Seleccioná variante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>Seleccioná variante</SelectItem>
                      {!usedLabels.has("unidad") && (
                        <SelectItem value={UNIDAD_ID}>Unidad</SelectItem>
                      )}
                      {availableTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">$</span>
                    <Input
                      ref={createPriceRef}
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
                      disabled={!pendingTemplateId || createVariant.isPending}
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
                </>
              )}
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

      {/* Empty state */}
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar variante</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar{" "}
              <strong>{deleteTarget?.variantLabel}</strong>? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {willLeaveZeroActive && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 mx-6 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Al eliminar esta variante el producto quedará sin variantes activas.
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
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
