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
  MoreHorizontal,
} from "lucide-react";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "../types";
import type { CardDensity } from "../types/order-ui.types";
import {
  formatCurrency,
  getTimeElapsed,
  canCompleteOrder,
  getPaymentStatusLabel,
  FINAL_STATUSES,
} from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";
import {
  kanbanCardVariants,
  categoryBadgeVariants,
  type CategoryBadgeVariantProps,
} from "../styles";
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
import { DEFAULT_KANBAN_STATUSES } from "../config/kanban-columns.config";
import { dotVariants } from "../theme";
import {
  getElapsedMinutes,
  getLatenessLevel,
  type LatenessLevel,
} from "../utils/order-lateness.utils";
import { HoverTooltip } from "./HoverTooltip";

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

// "Move to" menu — an alternative to drag & drop. Offers the same target
// statuses the board columns already accept on drop; it adds no new
// transition rules.
function OrderMoveMenu({
  order,
  currentStatus,
  onStatusChange,
}: {
  order: Order;
  currentStatus?: string;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("orders.status");
  const [isOpen, setIsOpen] = useState(false);

  // Final orders (Delivered/Cancelled) can't leave that status, so the menu
  // would only offer transitions the API rejects.
  if (!onStatusChange || FINAL_STATUSES.includes(currentStatus as OrderStatus)) return null;

  const targets = DEFAULT_KANBAN_STATUSES.filter((s) => s !== currentStatus);
  if (targets.length === 0) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <HoverTooltip content={t("actions.moveOrder")}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={t("actions.moveOrder")}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
        </HoverTooltip>
        <DropdownMenuContent
          align="end"
          className="min-w-[160px] z-[9999]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t("actions.moveTo")}
          </div>
          {targets.map((status: OrderStatus) => (
            <DropdownMenuItem
              key={status}
              onSelect={() => {
                onStatusChange(order.id, status);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <span
                className={cn("w-2 h-2 rounded-full shrink-0", dotVariants({ status }))}
              />
              <span className="text-slate-700">{tStatus(status)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
  badgeVariant = "slate",
  currentStatus,
  dragColor = "indigo",
  density = "regular",
}: OrderCardProps) {
  const t = useTranslations("orders");
  const [isDragging, setIsDragging] = useState(false);

  const orderNumber = formatOrderNumber(order.id, order.orderNumber);
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
            <span className="flex-1" />
            <TimeBadge order={order} currentStatus={currentStatus} />
          </div>
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

        {/* Footer: payment status (original styles) + quick "move to" menu */}
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100/80">
          {/* Payment method (icon) + Editable payment status */}
          <PaymentStatusEditor
            orderId={order.id}
            paymentMethod={order.paymentMethod}
            currentStatus={order.paymentStatus}
          />
          <span className="flex-1" />
          <OrderMoveMenu
            order={order}
            currentStatus={currentStatus}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>

    </>
  );
});
