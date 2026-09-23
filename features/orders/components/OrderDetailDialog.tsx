"use client";

import { lazy, Suspense, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

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
  isReadOnly?: boolean;
  onClose: () => void;
  /** "dialog" (default, centered modal) or "drawer" (right side panel) */
  variant?: "dialog" | "drawer";
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
  isReadOnly = false,
  onClose,
  variant = "dialog",
}: OrderDetailDialogProps) {
  const t = useTranslations("orders");
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]
  );

  const body = (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailContent
        orderId={orderId}
        onClose={onClose}
        isReadOnly={isReadOnly}
      />
    </Suspense>
  );

  if (variant === "drawer") {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        {/* `transform` (an identity, no visual effect) creates a containing
            block for `fixed` children — same reason as the Dialog variant:
            the Conversation tab's fixed footer must anchor to this panel,
            not to the viewport. */}
        <DrawerContent size="md" className="transform">
          <DrawerHeader>
            <DrawerTitle>{t("detail.title")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* `transform` (sin efecto visual: es la identidad) convierte a este
          div en containing block CSS para hijos `fixed` — sin esto, el
          footer `fixed` del tab Conversación (OrderConversationPanel) se
          posicionaría contra el viewport del browser en vez de contra este
          modal. */}
      <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-lg p-0 overflow-hidden transform">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {t("detail.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">{body}</div>
      </DialogContent>
    </Dialog>
  );
});
