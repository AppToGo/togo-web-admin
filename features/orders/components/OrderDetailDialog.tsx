"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderDetailContent } from "./OrderDetailContent";

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
export function OrderDetailDialog({
  orderId,
  isOpen,
  onClose,
  title = "Detalle de Orden",
}: OrderDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <OrderDetailContent orderId={orderId} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
