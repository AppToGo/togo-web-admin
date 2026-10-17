"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CategoryActions } from "./CategoryActions";
import type { BusinessCategory } from "../types/catalog.types";

/** Palabras clave visibles antes del "+N". */
const VISIBLE_KEYWORDS = 3;

interface CategoryCardProps {
  category: BusinessCategory;
  industryCategoryName: string | undefined;
  onEdit: (category: BusinessCategory) => void;
  onDelete: (category: BusinessCategory) => void;
  onToggleStatus: (category: BusinessCategory) => void;
  /** Sin palabras clave: generarlas con IA desde la tarjeta. */
  onRegenerateKeywords?: (id: string) => void;
  isRegeneratingKeywords?: boolean;
}

/**
 * Categoría del negocio en tarjeta (antes una fila de tabla): nombre,
 * descripción y estado arriba; las palabras clave con las que el bot la
 * encuentra; categoría de industria y slug como dato secundario.
 */
export function CategoryCard({
  category,
  industryCategoryName,
  onEdit,
  onDelete,
  onToggleStatus,
  onRegenerateKeywords,
  isRegeneratingKeywords,
}: CategoryCardProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const keywords = (category.searchKeywords ?? []).map((keyword) => keyword.value);
  const hidden = keywords.length - VISIBLE_KEYWORDS;
  const statusLabel = category.isActive
    ? tCommon("status.active")
    : tCommon("status.inactive");

  return (
    <li
      className={cn(
        "flex flex-col gap-3.5 rounded-3xl border border-white/90 bg-white/65 p-5",
        !category.isActive && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">{category.name}</h3>
          {category.description && (
            <p className="text-[13px] text-slate-500">{category.description}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            category.isActive
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {keywords.length === 0 ? (
          <>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {t("mobile.noKeywords")}
            </span>
            {onRegenerateKeywords && (
              <button
                type="button"
                onClick={() => onRegenerateKeywords(category.id)}
                disabled={isRegeneratingKeywords}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                {t("categories.card.generateKeywords")}
              </button>
            )}
          </>
        ) : (
          <>
            {keywords.slice(0, VISIBLE_KEYWORDS).map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-slate-100/95 px-2.5 py-0.5 text-xs text-slate-700"
              >
                {keyword}
              </span>
            ))}
            {hidden > 0 && (
              <span className="px-1 text-xs text-slate-500">+{hidden}</span>
            )}
          </>
        )}
      </div>

      <p className="truncate text-xs text-slate-500">
        {[industryCategoryName, `/${category.slug}`].filter(Boolean).join(" · ")}
      </p>

      <div className="flex items-center gap-2 border-t border-slate-200/80 pt-3.5">
        <Button
          variant="slate-outline"
          className="h-10 rounded-xl px-4"
          onClick={() => onEdit(category)}
        >
          {t("categories.card.edit")}
        </Button>
        <span className="flex-1" />
        <Switch
          checked={category.isActive}
          onCheckedChange={() => onToggleStatus(category)}
          aria-label={t("categories.card.toggle", { name: category.name })}
        />
        <CategoryActions
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </li>
  );
}
