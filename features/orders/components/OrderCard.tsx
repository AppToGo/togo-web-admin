"use client";

import { memo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Store,
  Home,
  Utensils,
  Banknote,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";
import type { Order, OrderItem, PaymentStatus } from "../types";
import {
  formatCurrency,
  getTimeElapsed,
  canCompleteOrder,
  getPaymentStatusLabel,
} from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";
import { kanbanCardVariants, categoryBadgeVariants } from "../styles";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateOrderPaymentStatus } from "../hooks/useOrders";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error.utils";

export type CardViewMode = "card" | "list";

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onClick?: () => void;
  badgeVariant?: string;
  currentStatus?: string;
  dragColor?: string;
  viewMode?: CardViewMode;
}

// Icono de método de pago con tooltip
function PaymentMethodIcon({ method }: { method?: string }) {
  const t = useTranslations("orders");
  const getIconAndLabel = () => {
    if (!method) return { icon: CreditCard, label: t("paymentMethods.NOT_SPECIFIED") };
    const lower = method.toLowerCase();
    if (lower === "cash") return { icon: Banknote, label: t("paymentMethods.CASH") };
    if (lower.includes("card") || lower === "dataphone")
      return { icon: CreditCard, label: t("paymentMethods.CREDIT_CARD") };
    if (lower === "transfer")
      return { icon: ArrowLeftRight, label: t("paymentMethods.TRANSFER") };
    if (lower === "wallet") return { icon: Wallet, label: t("paymentMethods.OTHER") };
    return { icon: CreditCard, label: method };
  };

  const { icon: Icon, label } = getIconAndLabel();

  return (
    <div className="group relative">
      <Icon className="w-3.5 h-3.5 text-current" />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
}

// Componente para editar el estado de pago con DropdownMenu de shadcn
// NOTA: El backend no permite transición de PAID a PENDING, solo PENDING a PAID
export function PaymentStatusEditor({
  orderId,
  currentStatus,
  paymentMethod,
}: {
  orderId: string;
  currentStatus: PaymentStatus;
  paymentMethod?: string;
}) {
  const t = useTranslations("orders");
  const [isOpen, setIsOpen] = useState(false);
  const updatePaymentStatus = useUpdateOrderPaymentStatus();

  const handleSelect = useCallback(
    (newStatus: PaymentStatus) => {
      if (newStatus !== currentStatus) {
        updatePaymentStatus.mutate({
          orderId,
          data: {
            paymentStatus: newStatus,
            changeNotes: t("paymentNotes.confirmedFromAdmin"),
          },
        });
      }
      setIsOpen(false);
    },
    [currentStatus, orderId, updatePaymentStatus, t]
  );

  // Badge base con icono de método de pago
  const badgeContent = (
    <>
      <PaymentMethodIcon method={paymentMethod} />
      <span>{getPaymentStatusLabel(currentStatus)}</span>
    </>
  );

  // Si ya está pagado, mostrar badge estático (no editable)
  if (currentStatus === "PAID") {
    return (
      <span
        className={cn(
          categoryBadgeVariants({ variant: "green" }),
          "flex items-center gap-1"
        )}
      >
        {badgeContent}
      </span>
    );
  }

  // Si está pendiente, mostrar dropdown para marcar como pagado
  // Wrapper con stopPropagation para evitar que se abra el modal de detalle
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              categoryBadgeVariants({ variant: "amber" }),
              "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
            )}
          >
            {badgeContent}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[140px] z-[9999]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            onSelect={() => handleSelect("PAID")}
            className="flex items-center gap-2 text-xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-700">{t("actions.confirmPayment")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Función para formatear el método de pago - uses translations
function formatPaymentMethod(method?: string, t?: ReturnType<typeof useTranslations>): string {
  if (!method) return t?.("paymentMethods.NOT_SPECIFIED") || "NOT_SPECIFIED";
  const key = method.toUpperCase();
  return t?.(`paymentMethods.${key}`) || key;
}

// Función para formatear el estado de pago - uses translations
function formatPaymentStatus(status?: string, t?: ReturnType<typeof useTranslations>): string {
  if (!status) return t?.("paymentStatus.UNKNOWN") || "UNKNOWN";
  const key = status.toUpperCase();
  return t?.(`paymentStatus.${key}`) || key;
}

// Función para formatear la hora
function formatOrderTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tipo de orden basado en la fuente
function getOrderTypeInfo(order: Order & { source?: string }, t?: ReturnType<typeof useTranslations>): {
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

  // No address + source OPERATOR → Table (created by operator)
  if (order.source === "OPERATOR") {
    return {
      label: t?.("deliveryTypes.table") || "Table",
      icon: <Utensils className="w-3 h-3" />,
      variant: "emerald",
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

// Componente para vista compacta de lista
function OrderListItem({
  order,
  onClick,
  dragColor = "indigo",
  isDragging = false,
  onDragStart,
  onDragEnd,
}: {
  order: Order;
  onClick: () => void;
  dragColor?: string;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const t = useTranslations("orders");
  const orderNumber = formatOrderNumber(order.id);
  const orderType = getOrderTypeInfo(order as Order & { source?: string }, t);
  const orderTime = formatOrderTime(order.createdAt);
  const fee = order.deliveryType === "DELIVERY" ? order.deliveryFee || 0 : 0;

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

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "p-3 bg-white rounded-card",
        "border border-slate-100 hover:border-slate-200",
        "hover:shadow-card transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging &&
          `opacity-60 rotate-1 scale-[1.02] shadow-lg ring-2 ${dragRingColors[dragColor] || dragRingColors.indigo}`
      )}
    >
      {/* Delivery address */}
      {orderType.isDelivery && order.address && (
        <div className="flex items-start gap-1 text-xs text-slate-500">
          <svg
            className="w-3 h-3 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-2">{order.address.addressText}</span>
        </div>
      )}

      {/* Header: Order number and Total */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-slate-900 text-base">
          {orderNumber}
        </span>
        <span className="font-bold text-slate-900 text-lg">
          {formatCurrency(order.totalAmount + fee)}
        </span>
      </div>

      {/* Footer: Type, Delivery, Time and Payment status */}
      <div className="flex items-center gap-2 text-xs">
        {/* Time */}
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3" />
          {orderTime}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Order type */}
        <span
          className={categoryBadgeVariants({
            variant: orderType.variant as any,
          })}
        >
          {orderType.icon}
          <span>{orderType.label}</span>
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Payment status - Editable */}
        <PaymentStatusEditor
          orderId={order.id}
          paymentMethod={order.paymentMethod}
          currentStatus={order.paymentStatus}
        />
      </div>
    </div>
  );
}

// Componente para mostrar items con "ver más" y desglose de totales
function OrderItemsList({
  items,
  totalAmount,
  deliveryFee,
  isDelivery,
}: {
  items?: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  isDelivery?: boolean;
}) {
  const t = useTranslations("orders");
  const [showAll, setShowAll] = useState(false);
  const MAX_ITEMS = 2;

  // Calcular subtotal
  const subtotal =
    items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0;
  const fee = isDelivery ? deliveryFee || 0 : 0;

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
  badgeVariant = "slate",
  currentStatus,
  dragColor = "indigo",
  viewMode = "card",
}: OrderCardProps) {
  const t = useTranslations("orders");
  const [isDragging, setIsDragging] = useState(false);

  const orderNumber = formatOrderNumber(order.id);
  const timeElapsed = getTimeElapsed(order.createdAt);
  const orderType = getOrderTypeInfo(order as Order & { source?: string }, t);

  const handleCompleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const validation = canCompleteOrder(order);
      if (!validation.valid) {
        toast.error(validation.message ? t(`errors.${validation.message}`) : t("errors.cannotComplete"));
        return;
      }
      onStatusChange?.(order.id, "COMPLETED");
    },
    [order, onStatusChange, t]
  );

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

  // Si es vista de lista, renderizar el componente compacto
  if (viewMode === "list") {
    return (
      <OrderListItem
        order={order}
        onClick={handleCardClick}
        dragColor={dragColor}
        isDragging={isDragging}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    );
  }

  // Vista de card (default)
  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          kanbanCardVariants({ elevation: "default" }),
          "animate-cardEnter hover:animate-cardHover cursor-grab active:cursor-grabbing transition-all duration-200",
          isDragging &&
            `opacity-50 rotate-2 scale-105 shadow-xl ring-2 ${
              dragRingColors[dragColor] || dragRingColors.indigo
            }`
        )}
        onClick={handleCardClick}
      >
        {/* Header: Order number, address (if delivery) and type */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-900 text-sm">
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
          </div>

          {/* Delivery address */}
          {orderType.isDelivery && order.address && (
            <div className="flex items-start gap-1 text-xs text-slate-500 mt-1">
              <svg
                className="w-3 h-3 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-2">{order.address.addressText}</span>
            </div>
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
          />
        </div>

        {/* Footer: Metadata (time and payment combined) */}
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100/80">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{timeElapsed}</span>
          </div>
          {/* Payment method (icon) + Editable payment status */}
          <PaymentStatusEditor
            orderId={order.id}
            paymentMethod={order.paymentMethod}
            currentStatus={order.paymentStatus}
          />
        </div>
      </div>

    </>
  );
});
