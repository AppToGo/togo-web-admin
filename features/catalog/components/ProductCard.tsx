"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Edit2, Trash2, Package, ImageOff, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CatalogProduct } from "../types/catalog.types";

interface ProductCardProps {
  product: CatalogProduct;
  onEdit?: (product: CatalogProduct) => void;
  onDelete?: (product: CatalogProduct) => void;
  viewMode?: "grid" | "list";
  selected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
  showImage?: boolean;
  categoryName?: string;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  viewMode = "grid",
  selected = false,
  onSelect,
  showCheckbox = false,
  showImage = true,
  categoryName,
}: ProductCardProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const [imageError, setImageError] = useState(false);

  const variants = product.variants ?? [];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);

  const variantsList = (
    <div className="border-t border-slate-100 mt-3 pt-3 space-y-1.5">
      {variants.length > 0 ? (
        variants.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="text-slate-600 truncate">{v.variantLabel}</span>
            <span className="font-semibold text-slate-900 shrink-0">
              {formatPrice(v.price)}
            </span>
          </div>
        ))
      ) : (
        <div className="text-xs text-slate-400 py-1">Sin variantes</div>
      )}
    </div>
  );

  const handleCardClick = (e: React.MouseEvent) => {
    if (!showCheckbox) return;
    const isInteractive = (e.target as HTMLElement).closest(
      'button, a, [role="menu"], input, [data-no-select]'
    );
    if (!isInteractive) onSelect?.();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  if (viewMode === "grid") {
    return (
      <div
        className={cn(
          "group relative bg-white/40 backdrop-blur-xl border border-white/80 rounded-card-lg p-4 h-full flex flex-col",
          "hover:shadow-card-md transition-all duration-200",
          selected && "ring-2 ring-indigo-500 bg-white",
          !product.isActive && "opacity-60"
        )}
        onClick={handleCardClick}
      >
        {/* Image */}
        {showImage ? (
          <div className="relative aspect-square rounded-card bg-slate-50 mb-4 overflow-hidden">
            {product.image && !imageError ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <ImageOff className="w-12 h-12 text-slate-300" />
              </div>
            )}

            {showCheckbox && (
              <div
                onClick={handleCheckboxClick}
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer z-[5]",
                  selected
                    ? "opacity-100 bg-indigo-600/70"
                    : "opacity-0 group-hover:opacity-100 bg-black/50"
                )}
                role="checkbox"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
              >
                <Check
                  className={cn(
                    "w-16 h-16 drop-shadow-lg",
                    selected ? "text-white" : "text-white/90"
                  )}
                />
              </div>
            )}

            <div className="absolute flex flex-col gap-1 top-2 left-2">
              {product.globalProductId ? (
                <span className="px-2 py-1 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                  {t("title")}
                </span>
              ) : (
                <span className="px-2 py-1 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                  {t("status.custom")}
                </span>
              )}
            </div>

            {product.variantCount > 0 && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-white/90 text-slate-700 rounded-full shadow-sm">
                  <Layers className="w-2.5 h-2.5" />
                  {product.variantCount}
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mb-2">
              {showCheckbox && (
                <div
                  onClick={handleCheckboxClick}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer z-[5]",
                    selected
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
                  )}
                  role="checkbox"
                  aria-checked={selected}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
                >
                  {selected && <Check className="w-4 h-4" />}
                </div>
              )}
              {product.globalProductId ? (
                <span className="px-2 py-1 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                  {t("title")}
                </span>
              ) : (
                <span className="px-2 py-1 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                  {t("status.custom")}
                </span>
              )}
              {product.variantCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
                  <Layers className="w-2.5 h-2.5" />
                  {product.variantCount} var.
                </span>
              )}
            </div>
          </>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <h3 className="font-semibold text-slate-900 line-clamp-1">
            {product.name}
          </h3>

          {categoryName && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-500">{categoryName}</span>
            </div>
          )}

          {product.description && (
            <p className="text-xs text-slate-500 line-clamp-2 flex-1">
              {product.description}
            </p>
          )}

          {variantsList}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/90 shadow-card-sm hover:bg-white"
              >
                <span className="sr-only">{tCommon("actions.actions")}</span>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="6" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="18" r="2" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(product);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {tCommon("buttons.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(product);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {tCommon("buttons.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      className={cn(
        "group bg-white/40 backdrop-blur-xl border border-white/80 rounded-card hover:shadow-card transition-all duration-200",
        selected && "ring-2 ring-indigo-500 bg-white",
        !product.isActive && "opacity-60"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-4 p-4 cursor-pointer">
        {showCheckbox && (
          <div
            onClick={handleCheckboxClick}
            className={cn(
              "shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer",
              selected
                ? "bg-indigo-500 text-white"
                : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
            )}
            role="checkbox"
            aria-checked={selected}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
          >
            {selected && <Check className="w-4 h-4" />}
          </div>
        )}

        {showImage && (
          <div className="relative w-16 h-16 rounded-card bg-slate-50 shrink-0 overflow-hidden">
            {product.image && !imageError ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900">{product.name}</h3>
            {product.globalProductId ? (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">
                {t("title")}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded">
                {t("status.custom")}
              </span>
            )}
            {product.variantCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">
                <Layers className="w-2.5 h-2.5" />
                {product.variantCount} variantes
              </span>
            )}
          </div>
          {categoryName && (
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {categoryName}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(product);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(product);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4">{variantsList}</div>
    </div>
  );
}
