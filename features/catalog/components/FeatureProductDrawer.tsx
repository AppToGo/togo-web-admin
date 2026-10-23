"use client";

/**
 * Drawer "Destacar producto" de la pantalla de productos.
 *
 * Aparte del de editar: arriba el producto en solo lectura, después las
 * sedes donde se destaca (tope por sede, MAX_FEATURED_PER_BRANCH en la API)
 * y la imagen, obligatoria. Los destacados del catálogo web siempre llevan
 * imagen, aunque el negocio tenga el catálogo configurado sin imágenes; si
 * el producto no tiene, se sube acá y queda como su imagen.
 */

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Star,
  Upload,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useSetProductFeatured, useUploadCatalogProductImage } from "../hooks";
import type { FeaturedProductsSummary } from "../services/catalog.service";
import type {
  BusinessCategory,
  CatalogProduct,
  FeaturedErrorBody,
} from "../types/catalog.types";

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function featuredError(err: unknown): FeaturedErrorBody {
  const data = (
    err as { response?: { data?: FeaturedErrorBody } } | null
  )?.response?.data;
  return { code: data?.code, branchIds: data?.branchIds };
}

interface FeatureProductDrawerProps {
  businessId: string;
  /** Producto a destacar; null cierra el drawer. */
  product: CatalogProduct | null;
  /** Sede del filtro de la pantalla: se marca si el producto no estaba destacado. */
  presetBranchId: string | null;
  summary: FeaturedProductsSummary | undefined;
  categories: BusinessCategory[];
  onClose: () => void;
  /** "Editar producto": cierra este drawer y abre el de edición. */
  onEditProduct?: (product: CatalogProduct) => void;
}

export function FeatureProductDrawer({
  businessId,
  product,
  presetBranchId,
  summary,
  categories,
  onClose,
  onEditProduct,
}: FeatureProductDrawerProps) {
  const t = useTranslations("catalog.featured");
  const setFeatured = useSetProductFeatured(businessId);

  return (
    <Drawer
      open={!!product}
      onOpenChange={(open) => {
        if (!open && !setFeatured.isPending) onClose();
      }}
      isLoading={setFeatured.isPending}
    >
      <DrawerContent size="md" data-testid="feature-product-drawer">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            {t("title")}
          </DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>
        {product && (
          <FeatureEditor
            key={product.id}
            businessId={businessId}
            product={product}
            presetBranchId={presetBranchId}
            summary={summary}
            categories={categories}
            isSaving={setFeatured.isPending}
            onCancel={onClose}
            onEditProduct={onEditProduct}
            onSave={(branchIds, image, wasFeatured) =>
              setFeatured.mutate(
                { productId: product.id, branchIds, image },
                {
                  onSuccess: () => {
                    toast.success(
                      branchIds.length === 0
                        ? t("removed")
                        : wasFeatured
                          ? t("updated")
                          : t("saved")
                    );
                    onClose();
                  },
                  onError: (err) => {
                    const { code, branchIds: fullIds } = featuredError(err);
                    if (code === "FEATURED_IMAGE_REQUIRED") {
                      toast.error(t("errors.imageRequired"));
                    } else if (code === "FEATURED_LIMIT_REACHED") {
                      toast.error(
                        t("errors.limitReached", {
                          max: summary?.limit ?? 10,
                          count: fullIds?.length ?? 1,
                        })
                      );
                    } else if (code === "INVALID_BRANCH") {
                      toast.error(t("errors.invalidBranch"));
                    } else {
                      toast.error(t("errors.generic"));
                    }
                  },
                }
              )
            }
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

interface EditorProps {
  businessId: string;
  product: CatalogProduct;
  presetBranchId: string | null;
  summary: FeaturedProductsSummary | undefined;
  categories: BusinessCategory[];
  isSaving: boolean;
  onCancel: () => void;
  onEditProduct?: (product: CatalogProduct) => void;
  onSave: (branchIds: string[], image: string | undefined, wasFeatured: boolean) => void;
}

function FeatureEditor({
  businessId,
  product,
  presetBranchId,
  summary,
  categories,
  isSaving,
  onCancel,
  onEditProduct,
  onSave,
}: EditorProps) {
  const t = useTranslations("catalog.featured");
  const { branches, isLoading: isLoadingBranches } = useEffectiveBranches();
  const upload = useUploadCatalogProductImage(businessId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limit = summary?.limit ?? 10;
  const current = useMemo(
    () => summary?.byProduct[product.id] ?? [],
    [summary, product.id]
  );
  const wasFeatured = current.length > 0;

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (current.length > 0) return new Set(current);
    if (presetBranchId) return new Set([presetBranchId]);
    return new Set();
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const image = uploadedImage ?? product.image ?? null;
  const hasImage = !!image && !imageFailed;

  const categoryName = product.businessCategoryId
    ? categories.find((c) => c.id === product.businessCategoryId)?.name
    : undefined;
  const variants = (product.variants ?? []).filter(
    (v) => v.isActive && !v.deletedAt
  );

  // Las sedes que el usuario no ve (no asignadas) se conservan tal cual: el
  // PUT reemplaza el conjunto completo.
  const visibleIds = new Set(branches.map((b) => b.id));
  const hiddenCurrent = current.filter((id) => !visibleIds.has(id));
  const branchIds = [...selected, ...hiddenCurrent];

  const unchanged =
    !uploadedImage &&
    branchIds.length === current.length &&
    branchIds.every((id) => current.includes(id));
  const needsImage = selected.size > 0 && !hasImage;
  const nothingToSave = !wasFeatured && selected.size === 0;
  const canSave = !needsImage && !nothingToSave && !unchanged && !upload.isPending;

  const toggleBranch = (branchId: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(branchId);
      else next.delete(branchId);
      return next;
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      toast.error(t("image.invalidType"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("image.tooLarge"));
      return;
    }
    try {
      const { imageUrl } = await upload.mutateAsync(file);
      setUploadedImage(imageUrl);
      setImageFailed(false);
    } catch {
      // El toast de error ya lo maneja useUploadCatalogProductImage.
    }
  };

  const saveLabel = !wasFeatured
    ? t("submit")
    : selected.size === 0 && hiddenCurrent.length === 0
      ? t("submitRemove")
      : t("submitUpdate");

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-7 pb-7 mt-4 space-y-6">
        {/* Producto, solo lectura */}
        <section
          aria-label={t("product.title")}
          className="p-4 rounded-card bg-slate-50 border border-slate-100 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("product.title")}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Lock className="w-3 h-3" />
              {t("product.readOnly")}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">{product.name}</p>
            {categoryName && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {categoryName}
              </p>
            )}
            {product.description && (
              <p className="text-sm text-slate-600">{product.description}</p>
            )}
          </div>
          {variants.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-1">
              {variants.map((v) => (
                <div key={v.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-slate-600 truncate">{v.variantLabel}</span>
                  <span className="font-semibold text-slate-900 shrink-0">
                    {formatCurrency(v.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {onEditProduct && (
            <p className="text-xs text-slate-500">
              {t.rich("product.editHint", {
                link: (chunks) => (
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {chunks}
                  </button>
                ),
              })}
            </p>
          )}
        </section>

        {/* Sedes */}
        <section aria-labelledby="featured-branches" className="space-y-3">
          <h3 id="featured-branches" className="text-sm font-semibold text-slate-900">
            {t("branches.title")}
          </h3>
          {isLoadingBranches ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 rounded-card bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : branches.length === 0 ? (
            <p className="text-sm text-slate-500">{t("branches.none")}</p>
          ) : (
            <div className="space-y-2">
              {branches.map((branch) => {
                const count = summary?.branchCounts[branch.id] ?? 0;
                const isChecked = selected.has(branch.id);
                // Una sede llena no admite más, salvo que el producto ya esté en ella.
                const isFull = count >= limit && !current.includes(branch.id);
                const inputId = `featured-branch-${branch.id}`;
                return (
                  <label
                    key={branch.id}
                    htmlFor={inputId}
                    className={cn(
                      "flex items-center gap-3 min-h-12 px-3 py-2 rounded-card border bg-white transition-colors",
                      isChecked ? "border-indigo-300" : "border-slate-200",
                      isFull ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    )}
                  >
                    <Checkbox
                      id={inputId}
                      checked={isChecked}
                      disabled={isFull}
                      onCheckedChange={(checked) => toggleBranch(branch.id, checked === true)}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-slate-900 truncate">{branch.name}</span>
                      {isFull && (
                        <span className="block text-xs text-amber-700">
                          {t("branches.full", { max: limit })}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs tabular-nums shrink-0",
                        count >= limit ? "text-amber-700 font-medium" : "text-slate-500"
                      )}
                    >
                      {t("branches.count", { count, max: limit })}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Imagen */}
        <section aria-labelledby="featured-image" className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="featured-image" className="text-sm font-semibold text-slate-900">
              {t("image.title")} <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-slate-500">{t("image.formats")}</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />

          {hasImage ? (
            <div className="space-y-3">
              <div className="relative h-48 rounded-card overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  {uploadedImage ? t("image.ready") : t("image.usingCurrent")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={upload.isPending}
                  disabled={upload.isPending || isSaving}
                >
                  {t("image.change")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={upload.isPending || isSaving}
                className="w-full h-40 rounded-card border-2 border-dashed border-amber-400 bg-amber-50 text-amber-800 flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-amber-100 disabled:opacity-60"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-semibold">
                  {upload.isPending ? t("image.uploading") : t("image.upload")}
                </span>
                <span className="text-xs">{t("image.formats")}</span>
              </button>
              <div
                role="alert"
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t("image.required")}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">{t("image.alwaysShown")}</p>
        </section>
      </div>

      <DrawerFooter className="border-t-slate-200">
        {needsImage && (
          <p className="mr-auto text-xs text-amber-700 self-center">{t("blocked.image")}</p>
        )}
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t("cancel")}
        </Button>
        <Button
          type="button"
          onClick={() => onSave(branchIds, uploadedImage ?? undefined, wasFeatured)}
          isLoading={isSaving}
          disabled={!canSave || isSaving}
        >
          <Star className="w-4 h-4 mr-2" />
          {saveLabel}
        </Button>
      </DrawerFooter>
    </>
  );
}
