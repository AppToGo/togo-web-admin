"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Edit2, Trash2, Power, Package, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BusinessProduct } from "../types/catalog.types";

interface ProductCardProps {
  product: BusinessProduct;
  onEdit?: (product: BusinessProduct) => void;
  onDelete?: (product: BusinessProduct) => void;
  onToggleStatus?: (product: BusinessProduct, isActive: boolean) => void;
  viewMode?: "grid" | "list";
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  viewMode = "grid",
}: ProductCardProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const [imageError, setImageError] = useState(false);

  const productImage = product.image || product.globalProduct?.image;
  const displayName = product.name;
  const displayDescription =
    product.description || product.globalProduct?.description;
  const displayBrand = product.globalProduct?.brand;

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Stock status
  const getStockStatus = () => {
    if (product.stock === null || product.stock === undefined) {
      return { label: t("stock.noControl"), color: "text-slate-400" };
    }
    if (product.stock === 0) {
      return { label: t("status.outOfStock"), color: "text-red-500" };
    }
    if (product.stock <= 10) {
      return {
        label: t("status.lowStockCount", { count: product.stock }),
        color: "text-amber-500",
      };
    }
    return {
      label: t("status.stockCount", { count: product.stock }),
      color: "text-emerald-600",
    };
  };

  const stockStatus = getStockStatus();

  console.log("product", product);
  // Grid view
  if (viewMode === "grid") {
    return (
      <div
        className={cn(
          "group relative bg-white rounded-card-lg p-4 shadow-card",
          "hover:shadow-card-md transition-all duration-200",
          "border border-slate-100",
          !product.isActive && "opacity-60 grayscale-[0.3]"
        )}
      >
        {/* Image */}
        <div className="relative aspect-square rounded-card bg-slate-50 mb-4 overflow-hidden">
          {productImage && !imageError ? (
            <img
              src={productImage}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <ImageOff className="w-12 h-12 text-slate-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isFromTemplate && (
              <span className="px-2 py-1 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                {t("title")}
              </span>
            )}
            {!product.isFromTemplate && (
              <span className="px-2 py-1 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                {t("status.custom")}
              </span>
            )}
          </div>

          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <span
              className={cn(
                "px-2 py-1 text-[10px] font-medium rounded-full",
                product.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {product.isActive
                ? tCommon("status.active")
                : tCommon("status.inactive")}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 line-clamp-1">
            {displayName}
          </h3>

          {displayBrand && (
            <p className="text-xs text-slate-500">{displayBrand}</p>
          )}

          {displayDescription && (
            <p className="text-xs text-slate-500 line-clamp-2">
              {displayDescription}
            </p>
          )}

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(product.price)}
              </span>
              <span className={cn("text-xs", stockStatus.color)}>
                {stockStatus.label}
              </span>
            </div>
          </div>

          {product.category && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-500">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <DropdownMenuItem onClick={() => onEdit?.(product)}>
                <Edit2 className="w-4 h-4 mr-2" />
                {tCommon("buttons.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleStatus?.(product, !product.isActive)}
              >
                <Power className="w-4 h-4 mr-2" />
                {product.isActive
                  ? t("actions.deactivate")
                  : t("actions.activate")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(product)}
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
        "group flex items-center gap-4 bg-white rounded-card p-4 shadow-card-sm",
        "hover:shadow-card transition-all duration-200",
        "border border-slate-100",
        !product.isActive && "opacity-60 grayscale-[0.3]"
      )}
    >
      {/* Image */}
      <div className="relative w-16 h-16 rounded-card bg-slate-50 flex-shrink-0 overflow-hidden">
        {productImage && !imageError ? (
          <img
            src={productImage}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Package className="w-6 h-6 text-slate-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-slate-900">{displayName}</h3>
          {product.isFromTemplate ? (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">
              {t("title")}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded">
              {t("status.custom")}
            </span>
          )}
          <span
            className={cn(
              "px-1.5 py-0.5 text-[10px] rounded",
              product.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            )}
          >
            {product.isActive
              ? tCommon("status.active")
              : tCommon("status.inactive")}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
          {displayBrand && <span>{displayBrand}</span>}
          {product.category && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {product.category.name}
            </span>
          )}
          <span className={stockStatus.color}>{stockStatus.label}</span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="text-lg font-bold text-slate-900">
          {formatPrice(product.price)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit?.(product)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleStatus?.(product, !product.isActive)}
        >
          <Power className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700"
          onClick={() => onDelete?.(product)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
