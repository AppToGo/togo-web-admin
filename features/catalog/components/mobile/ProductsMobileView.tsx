"use client";

/**
 * Mis productos en el teléfono (< md), según el diseño móvil: buscador,
 * categorías en pastillas, Todos · Activos · Inactivos y filas con foto (o
 * inicial), categoría, variantes, precio y el interruptor de activo.
 * Tocar una fila abre el mismo drawer de edición que en escritorio.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileFab } from "@/components/ui/mobile-fab";
import { PillGroup, SegmentedControl } from "@/components/ui/pill-group";
import { SearchField } from "@/components/ui/search-field";
import { cn, formatCurrency } from "@/lib/utils";
import { CatalogMobileNav } from "./CatalogMobileNav";
import type { BusinessCategory, CatalogProduct } from "../../types/catalog.types";

export type ProductStatusFilter = "all" | "active" | "inactive";

interface ProductsMobileViewProps {
  products: CatalogProduct[];
  total: number | undefined;
  isLoading: boolean;
  isError: boolean;
  categories: BusinessCategory[];
  categoryMap: Map<string, string>;
  showImages: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  status: ProductStatusFilter;
  onStatusChange: (status: ProductStatusFilter) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (product: CatalogProduct) => void;
  onToggleActive: (product: CatalogProduct, isActive: boolean) => void;
  onCreate: () => void;
  onImport: () => void;
}

function priceText(product: CatalogProduct, from: (price: string) => string): string | null {
  if (product.priceFrom === undefined) return null;
  const price = formatCurrency(product.priceFrom);
  const ranged =
    product.priceTo !== undefined && product.priceTo !== product.priceFrom;
  return ranged ? from(price) : price;
}

function ProductThumb({ product, showImage }: { product: CatalogProduct; showImage: boolean }) {
  const [failed, setFailed] = useState(false);
  if (showImage && product.image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt=""
        className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-800"
    >
      {product.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function ProductsMobileView({
  products,
  total,
  isLoading,
  isError,
  categories,
  categoryMap,
  showImages,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  status,
  onStatusChange,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onToggleActive,
  onCreate,
  onImport,
}: ProductsMobileViewProps) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  return (
    <div className="-mx-4 -mt-4 flex flex-col sm:-mx-6 sm:-mt-6" data-testid="products-mobile-view">
      <div className="flex flex-col gap-2.5 border-b border-slate-200/70 bg-white px-4 pb-3 pt-1 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-slate-500">
            {total !== undefined && t("products.stats.total", { count: total })}
          </span>
          <button
            type="button"
            onClick={onImport}
            aria-label={t("products.import")}
            className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Upload className="h-4 w-4" />
            {t("products.import")}
          </button>
        </div>
        <SearchField value={searchQuery} onChange={onSearchChange} placeholder={t("mobile.searchProducts")} />
        {categories.length > 0 && (
          <PillGroup
            label={t("mobile.categoryFilter")}
            value={selectedCategory}
            onChange={onCategoryChange}
            options={[
              { id: "all", label: t("mobile.allCategories") },
              ...categories.map((category) => ({ id: category.id, label: category.name })),
            ]}
            className="-mx-4 px-4 sm:-mx-6 sm:px-6"
          />
        )}
      </div>

      <div className="flex flex-col gap-2.5 p-3 sm:px-6">
        <SegmentedControl
          label={t("mobile.statusFilter")}
          value={status}
          onChange={onStatusChange}
          options={[
            { id: "all", label: t("mobile.status.all") },
            { id: "active", label: t("mobile.status.active") },
            { id: "inactive", label: t("mobile.status.inactive") },
          ]}
        />

        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-red-600">{t("products.error.title")}</p>
        ) : products.length === 0 ? (
          <p className="mt-8 text-center text-[15px] text-slate-500">{t("mobile.noProducts")}</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white">
            {products.map((product) => {
              const category = product.businessCategoryId
                ? categoryMap.get(product.businessCategoryId)
                : undefined;
              const price = priceText(product, (value) => t("mobile.priceFrom", { price: value }));
              return (
                <li
                  key={product.id}
                  className={cn(
                    "flex min-h-[72px] items-center gap-3 px-3 py-2.5",
                    !product.isActive && "opacity-60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <ProductThumb product={product} showImage={showImages} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-semibold text-slate-900">
                        {product.name}
                      </span>
                      <span className="truncate text-xs text-slate-500">
                        {[category, t("mobile.variants", { count: product.variantCount })]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {price && (
                        <span className="text-sm font-bold tabular-nums text-slate-900">{price}</span>
                      )}
                    </span>
                  </button>
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => onToggleActive(product, checked)}
                    aria-label={t("mobile.productActive", { name: product.name })}
                  />
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-10 rounded-full bg-white px-4 font-semibold text-slate-700 disabled:opacity-40"
            >
              {tc("pagination.previous")}
            </button>
            <span className="text-slate-500">{tc("pagination.pageOf", { page, totalPages })}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-10 rounded-full bg-white px-4 font-semibold text-slate-700 disabled:opacity-40"
            >
              {tc("pagination.next")}
            </button>
          </div>
        )}
        {/* Espacio para que el botón flotante no tape la última fila. */}
        <div aria-hidden className="h-14" />
      </div>

      <MobileFab label={t("products.create")} onClick={onCreate} aboveBottomNav testId="products-mobile-create" />
      <CatalogMobileNav />
    </div>
  );
}
