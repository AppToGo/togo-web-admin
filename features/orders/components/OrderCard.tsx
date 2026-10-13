"use client";

import { memo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Store,
  Home,
  Utensils,
  Banknote,
  PencilLine,
  Wallet,
} from "lucide-react";
import type { Order, OrderItem } from "../types";
import type { CardDensity } from "../types/order-ui.types";
import { formatCurrency, getTimeElapsed, isCustomerEditing } from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";
import {
  kanbanCardVariants,
  categoryBadgeVariants,
  type CategoryBadgeVariantProps,
} from "../styles";
import { cn } from "@/lib/utils";
import { PaymentProofIndicator } from "./PaymentProofDialog";
import { PaymentStatusEditor } from "./PaymentStatusEditor";
import {
  getElapsedMinutes,
  getLatenessLevel,
  type LatenessLevel,
} from "../utils/order-lateness.utils";
import { HoverTooltip } from "./HoverTooltip";
import { NextStatusButton } from "./NextStatusButton";

export type { CardDensity };

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onClick?: () => void;
  badgeVariant?: string;
  currentStatus?: string;
  dragColor?: string;
  density?: CardDensity;
}

// Tipo de orden basado en deliveryType (docs/architecture/pedidos-en-mesa.md)
function getOrderTypeInfo(order: Order, t?: ReturnType<typeof useTranslations>): {
  label: string;
  icon: React.ReactNode;
  variant: string;
  isDelivery: boolean;
} {
  // Usar deliveryType si está disponible, sino usar addressId como fallback
  const isDelivery = order.deliveryType
    ? order.deliveryType === "DELIVERY"
    : !!order.addressId;

  if (isDelivery) {
    return {
      label: t?.("deliveryTypes.DELIVERY") || "DELIVERY",
      icon: <Home className="w-3 h-3" />,
      variant: "blue",
      isDelivery: true,
    };
  }

  // Venta de mostrador (docs/caja-pedidos.md): se cobra y entrega en el
  // acto, no pasa por reparto ni mesa.
  if (order.deliveryType === "COUNTER") {
    return {
      label: t?.("deliveryTypes.COUNTER") || "COUNTER",
      icon: <Banknote className="w-3 h-3" />,
      variant: "amber",
      isDelivery: false,
    };
  }

  // Antes se inferían por `order.source === "OPERATOR"`, un valor que el
  // enum real OrderSource nunca produce (código muerto). deliveryType
  // ahora se setea de forma confiable a DINE_IN en los 3 caminos de
  // creación de pedido.
  if (order.deliveryType === "DINE_IN") {
    return {
      label: order.tableLabel
        ? `${t?.("deliveryTypes.table") || "Table"} · ${order.tableLabel}`
        : t?.("deliveryTypes.table") || "Table",
      icon: <Utensils className="w-3 h-3" />,
      // "emerald" is not a categoryBadgeVariants key (only "green", already
      // used by the "Paid" chip), so the dine-in chip rendered with no color.
      // "cyan" is unused and doesn't clash with delivery (blue), pickup
      // (amber) or paid (green).
      variant: "cyan",
      isDelivery: false,
    };
  }

  // Sin dirección + source WHATSAPP o no definido → Para recoger
  return {
    label: t?.("deliveryTypes.PICKUP") || "PICKUP",
    icon: <Store className="w-3 h-3" />,
    variant: "amber",
    isDelivery: false,
  };
}

// Terminal statuses: lateness no longer matters, so the timer stays muted.
const LATENESS_EXEMPT_STATUSES = new Set<string>(["COMPLETED", "CANCELLED", "ABANDONED"]);

const LATENESS_CLASS: Record<LatenessLevel, string> = {
  ok: "text-slate-500",
  warning: "text-amber-600 bg-amber-50",
  critical: "text-red-600 bg-red-50",
};

// Visual accent only — the timer text still comes from getTimeElapsed.
function getLatenessClass(order: Order, currentStatus?: string): string {
  if (currentStatus && LATENESS_EXEMPT_STATUSES.has(currentStatus)) {
    return "text-slate-400";
  }
  return LATENESS_CLASS[getLatenessLevel(getElapsedMinutes(order.createdAt))];
}

// Order type chip (delivery / pickup / dine-in) — same chip as the card
// header, reused by the grouped list view.
export function OrderTypeBadge({ order }: { order: Order }) {
  const t = useTranslations("orders");
  const orderType = getOrderTypeInfo(order, t);
  return (
    <span
      className={categoryBadgeVariants({
        variant: orderType.variant as CategoryBadgeVariantProps["variant"],
      })}
    >
      {orderType.icon}
      {orderType.label}
    </span>
  );
}

// Elapsed-time badge, colored by lateness.
export function TimeBadge({ order, currentStatus }: { order: Order; currentStatus?: string }) {
  const timeElapsed = getTimeElapsed(order.createdAt);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium tabular-nums shrink-0",
        getLatenessClass(order, currentStatus)
      )}
    >
      <Clock className="w-3 h-3" />
      {timeElapsed}
    </span>
  );
}

// Componente para mostrar items con "ver más" y desglose de totales
function OrderItemsList({
  items,
  totalAmount,
  deliveryFee,
  isDelivery,
  compact = false,
}: {
  items?: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  isDelivery?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("orders");
  const [showAll, setShowAll] = useState(false);
  const MAX_ITEMS = 2;

  // Calcular subtotal
  const subtotal =
    items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0;
  const fee = isDelivery ? deliveryFee || 0 : 0;

  // Compact density: a single line with the item summary and total, no
  // breakdown or "show more" — the full detail stays in the order drawer.
  if (compact) {
    const summary = items?.length
      ? items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")
      : t("empty.noProducts");
    return (
      <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 truncate" title={summary}>
          {summary}
        </span>
        <span className="font-bold text-slate-900 text-sm shrink-0">
          {formatCurrency(fee + totalAmount)}
        </span>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-slate-400 italic">{t("empty.noProducts")}</p>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-600">{t("detail.total")}</span>
          <span className="font-bold text-slate-900 text-sm">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    );
  }

  const displayItems = showAll ? items : items.slice(0, MAX_ITEMS);
  const hasMore = items.length > MAX_ITEMS;

  return (
    <div className="space-y-1">
      {displayItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between text-xs"
        >
          <span
            className="text-slate-600 truncate flex-1"
            title={item.productName}
          >
            {item.quantity}x {item.productName}
          </span>
          <span className="text-slate-700 font-medium ml-2">
            {formatCurrency(item.unitPrice * item.quantity)}
          </span>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(!showAll);
          }}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3 h-3" />
              {t("actions.showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {t("actions.showMore", { count: items.length - MAX_ITEMS })}
            </>
          )}
        </button>
      )}
      {/* Total breakdown */}
      <div className="space-y-1 pt-2 mt-2 border-t border-slate-100">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">{t("detail.subtotal")}</span>
          <span className="text-slate-600">{formatCurrency(subtotal)}</span>
        </div>
        {/* Delivery fee (if applicable) */}
        {isDelivery && fee > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{t("detail.deliveryFee")}</span>
            <span className="text-slate-600">{formatCurrency(fee)}</span>
          </div>
        )}
        {/* Total */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
          <span className="text-xs font-medium text-slate-600">{t("detail.total")}</span>
          <span className="font-bold text-slate-900 text-sm">
            {formatCurrency(fee + totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

export const OrderCard = memo(function OrderCard({
  order,
  onStatusChange,
  onClick,
  currentStatus,
  dragColor = "indigo",
  density = "regular",
}: OrderCardProps) {
  const t = useTranslations("orders");
  const [isDragging, setIsDragging] = useState(false);

  const orderNumber = formatOrderNumber(order.id, order.orderNumber);
  const orderType = getOrderTypeInfo(order as Order & { source?: string }, t);
  // Mientras el cliente edita el pedido no se puede arrastrar a otra
  // columna: el backend rechaza mandarlo a producción.
  const customerEditing = isCustomerEditing(order);

  const cashToSettle = order.cashCollection?.status === "PENDING_SETTLEMENT";

  const handleCardClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Mapa de colores para el ring de drag
  const dragRingColors: Record<string, string> = {
    gray: "ring-gray-400",
    blue: "ring-blue-400",
    purple: "ring-purple-400",
    green: "ring-emerald-400",
    orange: "ring-orange-400",
    pink: "ring-pink-400",
    amber: "ring-amber-400",
    cyan: "ring-cyan-400",
    indigo: "ring-indigo-400",
  };

  // Event handlers para drag and drop
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("orderId", order.id);
    e.dataTransfer.setData("fromStatus", currentStatus || "");

    // Add custom drag image or visual effect
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div
        draggable={!customerEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          kanbanCardVariants({ elevation: "default" }),
          "animate-cardEnter hover:animate-cardHover transition-all duration-200",
          customerEditing
            ? "cursor-pointer"
            : "cursor-grab active:cursor-grabbing",
          isDragging &&
            `opacity-50 rotate-2 scale-105 shadow-xl ring-2 ${
              dragRingColors[dragColor] || dragRingColors.indigo
            }`
        )}
        onClick={handleCardClick}
      >
        {/* Header: order number, type and elapsed time */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900 text-sm shrink-0">
              {orderNumber}
            </span>
            <span
              className={categoryBadgeVariants({
                variant: orderType.variant as any,
              })}
            >
              {orderType.icon}
              {orderType.label}
            </span>
            {cashToSettle && (
              <HoverTooltip content={t("cashPaidHint")}>
                <Banknote
                  className="w-4 h-4 text-emerald-600"
                  aria-label={t("cashPaidHint")}
                />
              </HoverTooltip>
            )}
            <span className="flex-1" />
            <TimeBadge order={order} currentStatus={currentStatus} />
          </div>
          {customerEditing && (
            <HoverTooltip content={t("card.customerEditingHint")}>
              <span
                className={cn(
                  categoryBadgeVariants({ variant: "amber" }),
                  "mt-1"
                )}
              >
                <PencilLine className="w-3 h-3" />
                {t("card.customerEditing")}
              </span>
            </HoverTooltip>
          )}
        </div>

        {/* Items de la orden con total incluido */}
        <div className="mb-3">
          <OrderItemsList
            items={order.items}
            totalAmount={order.totalAmount}
            deliveryFee={order.deliveryFee}
            isDelivery={
              order.deliveryType === "DELIVERY" || orderType.isDelivery
            }
            compact={density === "compact"}
          />
        </div>

        {/* Footer: payment status (original styles) + next-step button */}
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100/80">
          {/* Payment method (icon) + Editable payment status */}
          {cashToSettle ? (
            // El cliente ya pagó (billete verde arriba); este chip pasa a
            // decir dónde está el dinero. Al liquidar vuelve a "Pagado".
            <span
              className={cn(
                categoryBadgeVariants({ variant: "orange" }),
                "flex items-center gap-1"
              )}
              title={order.cashCollection?.holderName ?? undefined}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{t("cashPendingSettlement")}</span>
            </span>
          ) : (
            <PaymentStatusEditor
              orderId={order.id}
              total={order.total}
              branchId={order.branchId}
              paymentMethod={order.paymentMethod}
              currentStatus={order.paymentStatus}
              chargeLabel={`${orderNumber} · ${orderType.label}`}
            />
          )}
          <PaymentProofIndicator order={order} />
          <span className="flex-1" />
          <NextStatusButton
            order={order}
            status={currentStatus}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>

    </>
  );
});
