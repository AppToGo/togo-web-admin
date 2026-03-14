"use client";

import { useState } from "react";
import { Plus, ImageOff, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GlobalProduct } from "../types/catalog.types";

interface GlobalProductCardProps {
  product: GlobalProduct;
  onActivate?: (product: GlobalProduct) => void;
}

export function GlobalProductCard({
  product,
  onActivate,
}: GlobalProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        "group relative bg-white rounded-card-lg overflow-hidden",
        "shadow-card hover:shadow-card-md",
        "transition-all duration-200",
        "border border-slate-100"
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
            <Package className="w-12 h-12 text-slate-300 mb-2" />
            <span className="text-xs text-slate-400">Sin imagen</span>
          </div>
        )}

        {/* Brand Badge */}
        {product.brand && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-card-sm">
              {product.brand}
            </span>
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* SKU */}
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
          SKU: {product.sku}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Unit */}
        {product.unit && (
          <p className="text-xs text-slate-400 mb-3">
            Presentación: {product.unit}
          </p>
        )}

        {/* Suggested Price */}
        {product.basePrice && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">Precio sugerido:</span>
            <span className="text-sm font-medium text-slate-700">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(product.basePrice)}
            </span>
          </div>
        )}

        {/* Activate Button */}
        <Button
          onClick={() => onActivate?.(product)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Activar Producto
        </Button>
      </div>
    </div>
  );
}
