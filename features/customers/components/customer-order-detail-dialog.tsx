"use client";

import { useTranslations } from "next-intl";
import { OrderDetailDialog } from "@/features/orders/components/OrderDetailDialog";
import type { OrderDetailTranslations } from "@/features/orders/components/OrderDetailDialog";
import type { OrderStatus } from "@/features/orders/types";

interface CustomerOrderDetailDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * CustomerOrderDetailDialog - Order detail dialog for customer routes
 * 
 * This component wraps OrderDetailDialog and provides the necessary translations
 * from the next-intl context available in customer routes.
 * 
 * Use this component in customer detail pages instead of OrderDetailDialog directly
 * to ensure translations are properly provided.
 */
export function CustomerOrderDetailDialog({
  orderId,
  isOpen,
  onClose,
  title,
}: CustomerOrderDetailDialogProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const tStatus = useTranslations("orders.status");

  const translations: OrderDetailTranslations = {
    status: {
      DRAFT: tStatus("DRAFT"),
      CONFIRMED: tStatus("CONFIRMED"),
      PAYMENT_PENDING: tStatus("PAYMENT_PENDING"),
      PAID: tStatus("PAID"),
      IN_PROGRESS: tStatus("IN_PROGRESS"),
      READY: tStatus("READY"),
      ON_THE_WAY: tStatus("ON_THE_WAY"),
      COMPLETED: tStatus("COMPLETED"),
      CANCELLED: tStatus("CANCELLED"),
      ABANDONED: tStatus("ABANDONED"),
    },
    deliveryTypes: {
      delivery: t("deliveryTypes.delivery"),
      pickup: t("deliveryTypes.pickup"),
      table: t("deliveryTypes.table"),
    },
    detail: {
      total: t("detail.total"),
      customerInfo: t("detail.customerInfo"),
      deliveryAddress: t("detail.deliveryAddress"),
      itemsCount: t("detail.itemsCount"),
      subtotal: t("detail.subtotal"),
      deliveryFee: t("detail.deliveryFee"),
      notes: t("detail.notes"),
      history: t("detail.history"),
    },
    paymentInfo: t("paymentInfo"),
    paymentMethod: t("paymentMethod"),
    includesDelivery: t("includesDelivery"),
    paymentStatus: {
      PAID: t("paymentStatus.PAID"),
      PENDING: t("paymentStatus.PENDING"),
    },
    paymentMethods: {
      NOT_SPECIFIED: t("paymentMethods.NOT_SPECIFIED"),
      CASH: t("paymentMethods.CASH"),
      CREDIT_CARD: t("paymentMethods.CREDIT_CARD"),
      TRANSFER: t("paymentMethods.TRANSFER"),
      OTHER: t("paymentMethods.OTHER"),
    },
    errors: {
      cannotComplete: t("errors.cannotComplete"),
      paymentPending: t("errors.paymentPending"),
      mustBeReadyOrOnTheWay: t("errors.mustBeReadyOrOnTheWay"),
      alreadyCompleted: t("errors.alreadyCompleted"),
      cannotCompleteCancelled: t("errors.cannotCompleteCancelled"),
    },
    history: {
      created: t("history.created"),
    },
    noStockDialog: {
      title: t("noStockDialog.title"),
      description: t("noStockDialog.description"),
      messageTemplate: t("noStockDialog.messageTemplate"),
    },
    markNoStock: t("markNoStock"),
    whatsappOpened: t("whatsappOpened"),
    orderNotFound: t("orderNotFound"),
    common: {
      buttons: {
        cancel: tc("buttons.cancel"),
        confirm: tc("buttons.confirm"),
      },
      empty: {
        infoNotAvailable: tc("empty.infoNotAvailable"),
      },
    },
  };

  return (
    <OrderDetailDialog
      orderId={orderId}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      translations={translations}
    />
  );
}
