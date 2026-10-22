"use client";

/**
 * Drawer "Agregar recomendación" de la pantalla de productos.
 *
 * Arriba el producto que el cliente pide; debajo, los que el bot y el
 * catálogo web le ofrecen (el bot elige uno al azar entre los que estén
 * activos y con stock en la sede), y la lista de todos los productos para
 * agregarlos — mismo armado que el selector de Nuevo pedido. Guardar
 * reemplaza la lista completa.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useCatalogProducts,
  useProductRecommendations,
  useReplaceProductRecommendations,
} from "../hooks";
import type { RecommendedProduct } from "../services/catalog.service";
import type {
  BusinessCategory,
  CatalogProduct,
  CatalogProductsFilters,
} from "../types/catalog.types";

/** Mismo tope que la API (MAX_RECOMMENDATIONS_PER_PRODUCT). */
const MAX_RECOMMENDATIONS = 10;

/** Todos los productos del negocio para elegir; el filtro va en el cliente. */
const ALL_PRODUCTS: CatalogProductsFilters = { limit: 500 };

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function productPrice(product: CatalogProduct): number {
  if (product.priceFrom !== undefined) return product.priceFrom;
  const prices = (product.variants ?? []).map((v) => v.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function toRecommended(product: CatalogProduct): RecommendedProduct {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    price: productPrice(product),
    isActive: product.isActive,
  };
}

interface ProductRecommendationsDrawerProps {
  businessId: string;
  /** Producto al que se le eligen recomendados; null cierra el drawer. */
  product: CatalogProduct | null;
  onClose: () => void;
  categories: BusinessCategory[];
  showImages?: boolean;
}

export function ProductRecommendationsDrawer({
  businessId,
  product,
  onClose,
  categories,
  showImages = false,
}: ProductRecommendationsDrawerProps) {
  const t = useTranslations("catalog.recommendations");
  const replace = useReplaceProductRecommendations(businessId);

  return (
    <Drawer
      open={!!product}
      onOpenChange={(open) => {
        if (!open && !replace.isPending) onClose();
      }}
      isLoading={replace.isPending}
    >
      <DrawerContent size="lg" data-testid="product-recommendations-drawer">
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>
        {product && (
          <RecommendationsLoader
            key={product.id}
            businessId={businessId}
            product={product}
            categories={categories}
            showImages={showImages}
            isSaving={replace.isPending}
            onCancel={onClose}
            onSave={(ids) =>
              replace.mutate(
                { productId: product.id, recommendedProductIds: ids },
                {
                  onSuccess: () => {
                    toast.success(t("saved"));
                    onClose();
                  },
                  onError: () => toast.error(t("error")),
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
  categories: BusinessCategory[];
  showImages: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (recommendedProductIds: string[]) => void;
}

/** Espera los recomendados guardados para arrancar el editor con ellos. */
function RecommendationsLoader(props: EditorProps) {
  const t = useTranslations("catalog.recommendations");
  const { data, isLoading, isError } = useProductRecommendations(
    props.businessId,
    props.product.id
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-card" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="flex-1 p-6 text-sm text-red-600 text-center">
        {t("loadError")}
      </p>
    );
  }
  return <RecommendationsEditor {...props} initial={data.recommendations} />;
}

function RecommendationsEditor({
  businessId,
  product,
  categories,
  showImages,
  isSaving,
  onCancel,
  onSave,
  initial,
}: EditorProps & { initial: RecommendedProduct[] }) {
  const t = useTranslations("catalog.recommendations");
  const [selected, setSelected] = useState<RecommendedProduct[]>(initial);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: productsData, isLoading: isLoadingProducts } =
    useCatalogProducts(businessId, ALL_PRODUCTS);

  const candidates = useMemo(
    () => (productsData?.items ?? []).filter((p) => p.id !== product.id),
    [productsData, product.id]
  );
  const visible = useMemo(() => {
    const query = normalize(search.trim());
    return candidates.filter(
      (p) =>
        (!categoryId || p.businessCategoryId === categoryId) &&
        (!query || normalize(p.name).includes(query))
    );
  }, [candidates, search, categoryId]);
  const usedCategories = useMemo(() => {
    const used = new Set(candidates.map((p) => p.businessCategoryId));
    return categories.filter((c) => used.has(c.id));
  }, [candidates, categories]);
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [categories]);

  const selectedIds = new Set(selected.map((p) => p.id));
  const limitReached = selected.length >= MAX_RECOMMENDATIONS;

  const toggle = (candidate: CatalogProduct) => {
    if (selectedIds.has(candidate.id)) {
      setSelected((prev) => prev.filter((p) => p.id !== candidate.id));
    } else if (!limitReached) {
      setSelected((prev) => [...prev, toRecommended(candidate)]);
    }
  };
  const remove = (id: string) =>
    setSelected((prev) => prev.filter((p) => p.id !== id));

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
        {/* Producto que pide el cliente */}
        <div className="flex items-center gap-4 p-4 rounded-card bg-indigo-50 border border-indigo-100">
          <Thumb name={product.name} image={showImages ? product.image : undefined} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              {t("whenOrdering")}
            </p>
            <p className="text-base font-bold text-slate-900 truncate">{product.name}</p>
            <p className="text-sm text-slate-500 truncate">
              {[categoryName(product.businessCategoryId), formatPrice(productPrice(product))]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {/* Lo que se le ofrece */}
        <section className="space-y-3" aria-labelledby="recommendations-selected">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="recommendations-selected" className="text-sm font-semibold text-slate-900">
              {t("offer", { count: selected.length })}
            </h3>
            <span className="text-xs text-slate-500">{t("randomHint")}</span>
          </div>
          {selected.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 text-center border border-dashed border-slate-300 rounded-card">
              {t("empty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {selected.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-2 pl-3 pr-2 rounded-card border border-slate-200"
                >
                  <Thumb name={p.name} image={showImages ? p.image : undefined} size="sm" />
                  <span className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">
                    {p.name}
                  </span>
                  {!p.isActive && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
                      {t("inactive")}
                    </span>
                  )}
                  <span className="text-sm text-slate-500 shrink-0">{formatPrice(p.price)}</span>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label={`${t("remove")} ${p.name}`}
                    className="w-9 h-9 rounded-icon flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {limitReached && (
            <p className="text-xs text-amber-700">
              {t("limitReached", { max: MAX_RECOMMENDATIONS })}
            </p>
          )}
        </section>

        {/* Todos los productos */}
        <section className="space-y-3 pt-5 border-t border-slate-100" aria-labelledby="recommendations-all">
          <h3 id="recommendations-all" className="text-sm font-semibold text-slate-900">
            {t("addProducts")}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
          {usedCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <CategoryChip
                label={t("allCategories")}
                active={!categoryId}
                onClick={() => setCategoryId(null)}
              />
              {usedCategories.map((category) => (
                <CategoryChip
                  key={category.id}
                  label={category.name}
                  active={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                />
              ))}
            </div>
          )}
          <div className="space-y-2">
            {isLoadingProducts ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-card" />
              ))
            ) : visible.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {candidates.length === 0 ? t("noProducts") : t("noResults")}
              </p>
            ) : (
              visible.map((candidate) => {
                const isSelected = selectedIds.has(candidate.id);
                return (
                  <div
                    key={candidate.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-card transition-colors",
                      isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    <Thumb
                      name={candidate.name}
                      image={showImages ? candidate.image : undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {[
                          categoryName(candidate.businessCategoryId),
                          formatPrice(productPrice(candidate)),
                          candidate.isActive ? null : t("inactive"),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(candidate)}
                      disabled={!isSelected && limitReached}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? t("remove") : t("add")} ${candidate.name}`}
                      className={cn(
                        "h-9 px-3 rounded-icon flex items-center gap-1.5 text-sm font-semibold shrink-0 transition-colors disabled:opacity-50",
                        isSelected
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      )}
                    >
                      {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {isSelected ? t("added") : t("add")}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <DrawerFooter className="border-t-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t("cancel")}
        </Button>
        <Button
          type="button"
          onClick={() => onSave(selected.map((p) => p.id))}
          isLoading={isSaving}
          disabled={isSaving}
        >
          {t("save", { count: selected.length })}
        </Button>
      </DrawerFooter>
    </>
  );
}

function Thumb({
  name,
  image,
  size = "md",
}: {
  name: string;
  image?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "sm" ? "w-9 h-9" : size === "lg" ? "w-16 h-16" : "w-12 h-12";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" className={cn(box, "rounded-icon object-cover shrink-0 bg-slate-100")} />
    );
  }
  return (
    <div
      className={cn(
        box,
        "rounded-icon bg-slate-100 text-slate-400 font-semibold flex items-center justify-center shrink-0"
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );
}
