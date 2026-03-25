"use client";

import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import dinámico para evitar problemas de SSR/hidratación con next-intl
const OrderDetail = dynamic(
  () => import("./OrderDetail").then((mod) => mod.OrderDetail),
  { ssr: false }
);

interface OrderDetailDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

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
          {orderId && <OrderDetail orderId={orderId} onClose={onClose} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
