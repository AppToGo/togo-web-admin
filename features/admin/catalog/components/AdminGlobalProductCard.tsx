"use client";

import * as React from "react";
import { Edit, Trash2, MoreHorizontal, Store, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { GlobalProduct } from "../types/admin-catalog.types";

// ============================================================================
// TYPES
// ============================================================================

interface AdminGlobalProductCardProps {
  product: GlobalProduct;
  onEdit?: (product: GlobalProduct) => void;
  onDelete?: (product: GlobalProduct) => void;
  onToggleStatus?: (product: GlobalProduct, isActive: boolean) => void;
  viewMode?: "grid" | "list";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminGlobalProductCard({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  viewMode = "grid",
}: AdminGlobalProductCardProps) {
  const activationCount = product._count?.businessProducts || 0;

  // Grid View
  if (viewMode === "grid") {
    return (
      <div
        className={cn(
          "group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden",
          product.isActive
            ? "border-slate-200 hover:border-indigo-300 hover:shadow-md"
            : "border-slate-200 opacity-75"
        )}
      >
        {/* Image */}
        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x300/e2e8f0/64748b?text=Sin+Imagen";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-slate-400 text-sm">Sin imagen</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <Badge
              variant={product.isActive ? "default" : "secondary"}
              className={cn(
                "text-xs",
                product.isActive
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-100"
              )}
            >
              {product.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          {/* Activation Count */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur">
              <Store className="w-3 h-3 mr-1" />
              {activationCount}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* SKU */}
          <p className="text-xs font-mono text-slate-500 mb-1">{product.sku}</p>
          
          {/* Name */}
          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          {/* Brand & Industry */}
          <div className="flex items-center gap-2 mb-3">
            {product.brand && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {product.brand}
              </span>
            )}
            {product.industry && (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {product.industry.name}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Switch
                checked={product.isActive}
                onCheckedChange={(checked) => onToggleStatus?.(product, checked)}
                className="data-[state=checked]:bg-green-500"
              />
              <span className="text-xs text-slate-500">
                {product.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(product)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-200",
        product.isActive
          ? "border-slate-200 hover:border-indigo-300"
          : "border-slate-200 opacity-75"
      )}
    >
      {/* Image */}
      <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/100x100/e2e8f0/64748b?text=Sin+Imagen";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-400 text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <Badge
            variant={product.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs flex-shrink-0",
              product.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-100"
            )}
          >
            {product.isActive ? "Activo" : "Inactivo"}
          </Badge>
          <p className="text-xs font-mono text-slate-500 flex-shrink-0">{product.sku}</p>
        </div>
        <h3 className="font-semibold text-slate-900 truncate mt-1">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          {product.brand && (
            <span className="text-xs text-slate-600">{product.brand}</span>
          )}
          {product.industry && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-indigo-600">{product.industry.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Activation Count */}
      <div className="flex items-center gap-2 px-4 border-l">
        <Store className="w-4 h-4 text-slate-400" />
        <div>
          <p className="text-lg font-semibold text-slate-900">{activationCount}</p>
          <p className="text-xs text-slate-500">negocios</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Switch
          checked={product.isActive}
          onCheckedChange={(checked) => onToggleStatus?.(product, checked)}
          className="data-[state=checked]:bg-green-500"
        />
        <Button variant="ghost" size="icon" onClick={() => onEdit?.(product)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete?.(product)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
