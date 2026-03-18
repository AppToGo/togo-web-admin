"use client";

import * as React from "react";
import { AlertTriangle, Store } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("adminCatalog");
  const tCommon = useTranslations("common");
  const activationCount = product?._count?.businessProducts || 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {t("dialogs.delete.title")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {t("dialogs.delete.description", { name: product?.name ?? "", sku: product?.sku ?? "" })}
              </p>
              
              {activationCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Store className="w-4 h-4" />
                    <span className="font-medium">{tCommon("importantWarning")}</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    {t("dialogs.delete.warning", { count: activationCount })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {t("dialogs.delete.notActivated")}
                </p>
              )}

              <p className="text-sm text-red-600">
                {tCommon("actions.cannotUndo")}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            {tCommon("buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? tCommon("status.deleting") : tCommon("buttons.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
