"use client";

/**
 * Mis categorías en el teléfono (< md), según el diseño móvil: buscador y
 * tarjetas con inicial, nombre y palabras clave. Tocar una abre el mismo
 * diálogo de edición que en escritorio; el botón flotante, el de crear.
 */

import { useTranslations } from "next-intl";
import { MobileFab } from "@/components/ui/mobile-fab";
import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";
import { CatalogMobileNav } from "./CatalogMobileNav";
import type { BusinessCategory } from "../../types/catalog.types";

interface CategoriesMobileListProps {
  categories: BusinessCategory[];
  search: string;
  onSearchChange: (search: string) => void;
  /** Sin ellos (sin permiso) la fila no abre el editor ni se muestra el FAB. */
  onEdit?: (category: BusinessCategory) => void;
  onCreate?: () => void;
}

export function CategoriesMobileList({
  categories,
  search,
  onSearchChange,
  onEdit,
  onCreate,
}: CategoriesMobileListProps) {
  const t = useTranslations("catalog");

  return (
    <div className="-mx-4 -mt-4 flex flex-col sm:-mx-6 sm:-mt-6" data-testid="categories-mobile-list">
      <div className="flex flex-col gap-2.5 border-b border-slate-200/70 bg-white px-4 pb-3 pt-1 sm:px-6">
        <span className="text-xs text-slate-500">{t("mobile.categoriesHint")}</span>
        <SearchField value={search} onChange={onSearchChange} placeholder={t("mobile.searchCategories")} />
      </div>

      <div className="flex flex-col gap-2 p-3 sm:px-6">
        {categories.length === 0 ? (
          <p className="mt-8 text-center text-[15px] text-slate-500">{t("categories.noResults")}</p>
        ) : (
          categories.map((category) => {
            const keywords = (category.searchKeywords ?? []).map((k) => k.value);
            return (
              <button
                key={category.id}
                type="button"
                onClick={onEdit ? () => onEdit(category) : undefined}
                className={cn(
                  "flex min-h-[68px] items-center gap-3 rounded-[14px] bg-white px-3.5 py-3 text-left",
                  !category.isActive && "opacity-60"
                )}
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-800"
                >
                  {category.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold text-slate-900">{category.name}</span>
                  <span className="truncate text-xs text-slate-500">
                    {keywords.length > 0
                      ? t("mobile.keywords", { list: keywords.join(", ") })
                      : t("mobile.noKeywords")}
                  </span>
                </span>
                {!category.isActive && (
                  <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {t("mobile.inactive")}
                  </span>
                )}
              </button>
            );
          })
        )}
        <div aria-hidden className="h-14" />
      </div>

      {onCreate && (
        <MobileFab label={t("categories.new")} onClick={onCreate} aboveBottomNav testId="categories-mobile-create" />
      )}
      <CatalogMobileNav />
    </div>
  );
}
