"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Store,
  Home,
  Utensils,
  HandCoins,
  Check,
  Banknote,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";
import type { Order, OrderItem, PaymentStatus } from "../types";
import {
  formatCurrency,
  getTimeElapsed,
  canCompleteOrder,
  STATUS_LABELS,
  getPaymentStatusLabel,
} from "../utils/order-status.utils";
import { kanbanCardVariants, categoryBadgeVariants } from "../styles";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "./OrderDetail";
import { useUpdateOrderPaymentStatus } from "../hooks/useOrders";

export type CardViewMode = "card" | "list";

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  badgeVariant?: string;
  currentStatus?: string;
  dragColor?: string;
  viewMode?: CardViewMode;
}

// Icono de método de pago con tooltip
function PaymentMethodIcon({ method }: { method?: string }) {
  const getIconAndLabel = () => {
    if (!method) return { icon: CreditCard, label: "No especificado" };
    const lower = method.toLowerCase();
    if (lower === "cash")
      return { icon: Banknote, label: "Efectivo" };
    if (lower.includes("card") || lower === "dataphone")
      return { icon: CreditCard, label: "Tarjeta" };
    if (lower === "transfer")
      return { icon: ArrowLeftRight, label: "Transferencia" };
    if (lower === "wallet")
      return { icon: Wallet, label: "Billetera" };
    return { icon: CreditCard, label: method };
  };

  const { icon: Icon, label } = getIconAndLabel();

  return (
    <div className="group relative">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
}

// Componente para editar el estado de pago rápidamente
function PaymentStatusEditor({
  orderId,
  currentStatus,
  paymentMethod,
}: {
  orderId: string;
  currentStatus: PaymentStatus;
  paymentMethod?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const updatePaymentStatus = useUpdateOrderPaymentStatus();

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (newStatus: PaymentStatus) => {
      if (newStatus !== currentStatus) {
        updatePaymentStatus.mutate({
          orderId,
          data: {
            paymentStatus: newStatus,
            changeNotes:
              newStatus === "PAID"
                ? "Pago confirmado desde panel admin"
                : "Pago marcado como pendiente",
          },
        });
      }
      setIsOpen(false);
    },
    [currentStatus, orderId, updatePaymentStatus]
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen((prev) => !prev);
    },
    []
  );

  // Solo mostrar la opción opuesta
  const oppositeOption: PaymentStatus =
    currentStatus === "PAID" ? "PENDING" : "PAID";
  const oppositeLabel = oppositeOption === "PAID" ? "Marcar pagado" : "Marcar pendiente";
  const oppositeVariant = oppositeOption === "PAID" ? "green" : "amber";

  return (
    <div ref={containerRef} className="relative">
      {/* Badge clickeable de estado con icono de método de pago DENTRO */}
      <button
        onClick={handleToggle}
        className={cn(
          categoryBadgeVariants({
            variant: currentStatus === "PAID" ? "green" : "amber",
          }),
          "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
        )}
      >
        {/* Icono de método de pago con tooltip - DENTRO del badge */}
        <PaymentMethodIcon method={paymentMethod} />
        <span>{getPaymentStatusLabel(currentStatus)}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {/* Dropdown con solo la opción opuesta - z-index extremo para no quedar oculto */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-[9999] mt-1 min-w-[130px]",
            "bg-white rounded-card shadow-card-lg border border-slate-100",
            "py-1 animate-in fade-in zoom-in-95 duration-100"
          )}
          style={{
            top: containerRef.current 
              ? containerRef.current.getBoundingClientRect().bottom + 4 
              : 0,
            left: containerRef.current 
              ? containerRef.current.getBoundingClientRect().right - 130 
              : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSelect(oppositeOption)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-xs",
              "hover:bg-slate-50 transition-colors",
              "text-left"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                oppositeVariant === "green" ? "bg-green-500" : "bg-amber-500"
              )}
            />
            <span className="flex-1 text-slate-700">{oppositeLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Función para formatear el ID como número de orden
function formatOrderNumber(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

// Función para formatear el método de pago
function formatPaymentMethod(method?: string): string {
  if (!method) return "No especificado";
  const methods: Record<string, string> = {
    cash: "Efectivo",
    credit_card: "Tarjeta crédito",
    debit_card: "Tarjeta débito",
    transfer: "Transferencia",
    wallet: "Billetera",
    dataphone: "Datáfono",
  };
  return methods[method.toLowerCase()] || method;
}

// Función para formatear el estado de pago
function formatPaymentStatus(status?: string): string {
  if (!status) return "Desconocido";
  const statuses: Record<string, string> = {
    paid: "Pagado",
    pending: "Pendiente",
  };
  return statuses[status.toLowerCase()] || status;
}

// Función para formatear la hora
function formatOrderTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tipo de orden basado en la fuente
function getOrderTypeInfo(order: Order & { source?: string }): {
  label: string;
  icon: React.ReactNode;
  variant: string;
  isDelivery: boolean;
} {
  // Si tiene dirección → Domicilio
  if (order.addressId) {
    return {
      label: "Domicilio",
      icon: <Home className="w-3 h-3" />,
      variant: "blue",
      isDelivery: true,
    };
  }

  // Sin dirección + source OPERATOR → En mesa (creado por operador)
  if (order.source === "OPERATOR") {
    return {
      label: "En mesa",
      icon: <Utensils className="w-3 h-3" />,
      variant: "emerald",
      isDelivery: false,
    };
  }

  // Sin dirección + source WHATSAPP o no definido → Para recoger
  return {
    label: "Recoger",
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
  const orderNumber = formatOrderNumber(order.id);
  const orderType = getOrderTypeInfo(order as Order & { source?: string });
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
      {/* Dirección si es domicilio */}
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

      {/* Header: Número de orden y Total */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-slate-900 text-base">
          {orderNumber}
        </span>
        <span className="font-bold text-slate-900 text-lg">
          {formatCurrency(order.totalAmount + fee)}
        </span>
      </div>

      {/* Footer: Tipo, Domicilio, Hora y Estado de pago */}
      <div className="flex items-center gap-2 text-xs">
        {/* Hora */}
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3" />
          {orderTime}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tipo de orden */}
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

        {/* Estado de pago - Editable */}
        <PaymentStatusEditor
          orderId={order.id}
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
  const [showAll, setShowAll] = useState(false);
  const MAX_ITEMS = 2;

  // Calcular subtotal
  const subtotal =
    items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0;
  const fee = isDelivery ? deliveryFee || 0 : 0;

  if (!items || items.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-slate-400 italic">Sin productos</p>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-600">Total</span>
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
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Ver {items.length - MAX_ITEMS} más
            </>
          )}
        </button>
      )}
      {/* Desglose de totales */}
      <div className="space-y-1 pt-2 mt-2 border-t border-slate-100">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Subtotal</span>
          <span className="text-slate-600">{formatCurrency(subtotal)}</span>
        </div>
        {/* Domicilio (solo si aplica) */}
        {isDelivery && fee > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Domicilio</span>
            <span className="text-slate-600">{formatCurrency(fee)}</span>
          </div>
        )}
        {/* Total */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
          <span className="text-xs font-medium text-slate-600">Total</span>
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
  badgeVariant = "slate",
  currentStatus,
  dragColor = "indigo",
  viewMode = "card",
}: OrderCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const orderNumber = formatOrderNumber(order.id);
  const timeElapsed = getTimeElapsed(order.createdAt);
  const orderType = getOrderTypeInfo(order as Order & { source?: string });

  const handleCompleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const validation = canCompleteOrder(order);
      if (!validation.valid) {
        setShowPaymentAlert(true);
        return;
      }
      onStatusChange?.(order.id, "COMPLETED");
    },
    [order, onStatusChange]
  );

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

    // Agregar una imagen personalizada o efecto visual
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Si es vista de lista, renderizar el componente compacto
  if (viewMode === "list") {
    return (
      <>
        <OrderListItem
          order={order}
          onClick={() => setIsDetailOpen(true)}
          dragColor={dragColor}
          isDragging={isDragging}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />

        {/* Dialog de detalle */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="bg-white/90 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Orden</DialogTitle>
            </DialogHeader>
            <OrderDetail
              orderId={order.id}
              onClose={() => setIsDetailOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
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
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Header: Número de orden, dirección (si es domicilio) y tipo */}
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

          {/* Dirección si es domicilio */}
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

        {/* Footer: Metadata (tiempo y pago combinado) */}
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100/80">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{timeElapsed}</span>
          </div>
          {/* Método de pago (icono) + Estado de pago editable */}
          <PaymentStatusEditor
            orderId={order.id}
            paymentMethod={order.paymentMethod}
            currentStatus={order.paymentStatus}
          />
        </div>
      </div>

      {/* Dialog de detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Orden</DialogTitle>
          </DialogHeader>
          <OrderDetail
            orderId={order.id}
            onClose={() => setIsDetailOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Alert de pago pendiente */}
      <Dialog open={showPaymentAlert} onOpenChange={setShowPaymentAlert}>
        <DialogContent className="max-w-sm bg-white">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No se puede completar
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Esta orden tiene el pago pendiente. Debes confirmar el pago antes
              de marcarla como completada.
            </p>
            <Button
              onClick={() => setShowPaymentAlert(false)}
              className="w-full"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
