"use client";

import { useTranslations } from "next-intl";
import { OrderDetailContent, OrderDetailContentProps } from "./OrderDetailContent";
import type { OrderStatus } from "../types";

/**
 * Translation interface for OrderDetailContent
 * This allows the component to be used outside of next-intl context
 */
export interface OrderDetailTranslations {
  // Status labels
  status: Record<OrderStatus, string>;
  // Delivery types
  deliveryTypes: {
    delivery: string;
    pickup: string;
    table: string;
  };
  // Detail section labels
  detail: {
    total: string;
    customerInfo: string;
    deliveryAddress: string;
    itemsCount: string;
    subtotal: string;
    deliveryFee: string;
    notes: string;
    history: string;
  };
  // Payment
  paymentInfo: string;
  paymentMethod: string;
  includesDelivery: string;
  // Payment status
  paymentStatus: {
    PAID: string;
    PENDING: string;
  };
  // Payment methods
  paymentMethods: {
    NOT_SPECIFIED: string;
    CASH: string;
    CREDIT_CARD: string;
    TRANSFER: string;
    OTHER: string;
  };
  // Errors
  errors: {
    cannotComplete: string;
    paymentPending: string;
    mustBeReadyOrOnTheWay: string;
    alreadyCompleted: string;
    cannotCompleteCancelled: string;
  };
  // History
  history: {
    created: string;
  };
  // No stock dialog
  noStockDialog: {
    title: string;
    description: string;
    messageTemplate: string;
  };
  // Actions
  markNoStock: string;
  whatsappOpened: string;
  orderNotFound: string;
  // Common buttons (from common namespace)
  common: {
    buttons: {
      cancel: string;
      confirm: string;
    };
    empty: {
      infoNotAvailable: string;
    };
  };
}

export interface OrderDetailContainerProps extends Omit<OrderDetailContentProps, 'translations'> {
  // No additional props needed
}

/**
 * OrderDetailContainer - Container component that provides translations
 * 
 * This component wraps OrderDetailContent and provides all translations
 * from next-intl. It can be used in any context where next-intl is available.
 * 
 * For contexts where next-intl is NOT available (e.g., customer routes),
 * use OrderDetailContent directly and pass translations via props.
 */
export function OrderDetailContainer({ orderId, onClose }: OrderDetailContainerProps) {
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

  return <OrderDetailContent orderId={orderId} onClose={onClose} translations={translations} />;
}
