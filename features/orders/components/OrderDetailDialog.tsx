"use client";

import { lazy, Suspense, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const OrderDetailContent = lazy(() =>
  import("./OrderDetailContent").then((mod) => ({
    default: mod.OrderDetailContent,
  }))
);

// Componente skeleton para fallback
function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

interface OrderDetailDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * OrderDetailDialog - Reusable dialog for displaying order details
 *
 * This component works in ANY route (orders or customers) because
 * OrderDetailContent uses useTranslations directly and the NextIntlClientProvider
 * is available at the root layout level.
 *
 * USAGE:
 *
 * ```tsx
 * <OrderDetailDialog
 *   orderId="..."
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Order Details"
 * />
 * ```
 */
export const OrderDetailDialog = memo(function OrderDetailDialog({
  orderId,
  isOpen,
  onClose,
  title = "Detalle de Orden",
}: OrderDetailDialogProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <Suspense fallback={<OrderDetailSkeleton />}>
            <OrderDetailContent orderId={orderId} onClose={onClose} />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
});
