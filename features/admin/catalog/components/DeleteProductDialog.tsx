"use client";

import * as React from "react";
import { AlertTriangle, Store } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { GlobalProduct } from "../types/admin-catalog.types";

// ============================================================================
// TYPES
// ============================================================================

interface DeleteProductDialogProps {
  product: GlobalProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeleteProductDialog({
  product,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteProductDialogProps) {
  const activationCount = product?._count?.businessProducts || 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            ¿Eliminar producto global?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Estás a punto de eliminar <strong>{product?.name}</strong> (SKU: {product?.sku}).
              </p>
              
              {activationCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Store className="w-4 h-4" />
                    <span className="font-medium">Advertencia importante</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    Este producto está activado en <strong>{activationCount} negocios</strong>.
                    Al eliminarlo, se eliminará de todos los catálogos de negocios.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Este producto no está activado en ningún negocio.
                </p>
              )}

              <p className="text-sm text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
