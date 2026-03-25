"use client";

import { useTranslations } from "next-intl";
import { OrderDetailDialog } from "@/features/orders/components/OrderDetailDialog";

interface CustomerOrderDetailDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CustomerOrderDetailDialog - Order detail dialog for customer routes
 * 
 * This is a thin wrapper around OrderDetailDialog that provides
 * the translated title. The actual translations for the content
 * are handled internally by OrderDetailContent using useTranslations.
 * 
 * Since the NextIntlClientProvider is available at the root layout,
 * useTranslations works in both orders and customers routes.
 */
export function CustomerOrderDetailDialog({
  orderId,
  isOpen,
  onClose,
}: CustomerOrderDetailDialogProps) {
  const t = useTranslations("orders");

  return (
    <OrderDetailDialog
      orderId={orderId}
      isOpen={isOpen}
      onClose={onClose}
      title={t("detail.title")}
    />
  );
}
