"use client";

import { useCallback, useMemo, useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Package,
  StickyNote,
  Store,
  Home,
  Utensils,
  AlertTriangle,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  useOrder,
  useOrderHistory,
  useUpdateOrderStatus,
} from "../hooks/useOrders";
import type { OrderStatus, OrderItem } from "../types";
import {
  STATUS_LABELS,
  formatCurrency,
  formatOrderDate,
  canCompleteOrder,
} from "../utils/order-status.utils";
import { categoryBadgeVariants } from "../styles";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error.utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentStatusEditor } from "./OrderCard";
import { getColumnVariant } from "../config/kanban-columns.config";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/stores/auth.store";

interface OrderDetailProps {
  orderId: string;
  onClose?: () => void;
}

// Tipo de orden con icono y color
function getOrderTypeInfo(order: {
  deliveryType?: string;
  addressId?: string | null;
  source?: string;
}): {
  label: string;
  icon: React.ReactNode;
  variant: string;
} {
  const isDelivery = order.deliveryType
    ? order.deliveryType === "DELIVERY"
    : !!order.addressId;

  if (isDelivery) {
    return {
      label: "Domicilio",
      icon: <Home className="w-3 h-3" />,
      variant: "blue",
    };
  }

  if (order.source === "OPERATOR") {
    return {
      label: "En mesa",
      icon: <Utensils className="w-3 h-3" />,
      variant: "emerald",
    };
  }

  return {
    label: "Recoger",
    icon: <Store className="w-3 h-3" />,
    variant: "amber",
  };
}

// Función para formatear el ID como número de orden
function formatOrderNumber(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

// Componente para cambiar estado de orden (similar a PaymentStatusEditor)
function OrderStatusEditor({
  orderId,
  currentStatus,
  onStatusChange,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const variant = getColumnVariant(currentStatus);

  const handleSelect = useCallback(
    (newStatus: OrderStatus) => {
      if (newStatus !== currentStatus) {
        onStatusChange(newStatus);
      }
      setIsOpen(false);
    },
    [currentStatus, onStatusChange]
  );

  // Estados disponibles (incluyendo el actual para mostrarlo en su posición)
  // Orden lógico del flujo: CONFIRMED → IN_PROGRESS → READY → ON_THE_WAY → COMPLETED
  // CANCELLED se muestra al final como opción de excepción
  const availableStatuses: OrderStatus[] = [
    "CONFIRMED",
    "IN_PROGRESS",
    "READY",
    "ON_THE_WAY",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            categoryBadgeVariants({ variant: variant as any }),
            "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 text-xs"
          )}
        >
          <span>{STATUS_LABELS[currentStatus]}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[160px] z-[9999]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {availableStatuses.map((status) => {
          const isCurrent = status === currentStatus;
          return (
            <DropdownMenuItem
              key={status}
              onSelect={() => handleSelect(status)}
              disabled={isCurrent}
              className={cn(
                "flex items-center gap-2 text-xs",
                isCurrent
                  ? "opacity-50 cursor-not-allowed bg-slate-50"
                  : "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  getColumnVariant(status) === "blue" && "bg-blue-500",
                  getColumnVariant(status) === "purple" && "bg-purple-500",
                  getColumnVariant(status) === "orange" && "bg-orange-500",
                  getColumnVariant(status) === "emerald" && "bg-emerald-500",
                  getColumnVariant(status) === "pink" && "bg-pink-500",
                  getColumnVariant(status) === "gray" && "bg-slate-500"
                )}
              />
              <span
                className={cn(
                  "flex-1",
                  isCurrent ? "text-slate-500 font-medium" : "text-slate-700"
                )}
              >
                {STATUS_LABELS[status]}
              </span>
              {isCurrent && (
                <Check className="w-3.5 h-3.5 text-slate-400" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrderDetail({ orderId, onClose }: OrderDetailProps) {
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId);
  const { data: history } = useOrderHistory(orderId);
  const updateStatus = useUpdateOrderStatus();
  const [showNoStockDialog, setShowNoStockDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const { user } = useAuthStore();

  // Verificar permisos para ver historial
  const canViewHistory =
    user?.role === "OWNER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const handleStatusChange = useCallback(
    (newStatus: OrderStatus) => {
      if (!order || newStatus === order.status) return;

      if (newStatus === "COMPLETED") {
        const validation = canCompleteOrder(order);
        if (!validation.valid) {
          toast.error(validation.message || "No se puede completar la orden");
          return;
        }
      }

      updateStatus.mutate(
        { orderId, data: { status: newStatus } },
        {
          onSuccess: () => {
            onClose?.();
          },
        }
      );
    },
    [order, orderId, updateStatus, onClose]
  );

  const handleNoStock = useCallback((item: OrderItem) => {
    setSelectedItem(item);
    setShowNoStockDialog(true);
  }, []);

  const confirmNoStock = useCallback(() => {
    if (!selectedItem || !order?.customer?.phoneNumber) return;

    const message = `Hola, lamentamos informarte que el producto "${selectedItem.productName}" no está disponible en este momento para tu orden ${formatOrderNumber(order.id)}. Te ofrecemos disculpas y alternativas.`;

    const phone = order.customer.phoneNumber.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    toast.success("WhatsApp abierto con el mensaje para el cliente");

    setShowNoStockDialog(false);
    setSelectedItem(null);
  }, [selectedItem, order]);

  // Calcular totales incluyendo domicilio
  const { subtotal, deliveryFee, total } = useMemo(() => {
    if (!order) return { subtotal: 0, deliveryFee: 0, total: 0 };

    const itemsTotal =
      order.items?.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      ) || 0;

    const isDelivery = order.deliveryType === "DELIVERY" || !!order.addressId;
    const fee = isDelivery ? order.deliveryFee || 0 : 0;

    return {
      subtotal: itemsTotal,
      deliveryFee: fee,
      total: itemsTotal + fee,
    };
  }, [order]);

  if (isLoadingOrder) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-12 h-12 text-slate-300 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-slate-500">No se encontró la orden</p>
      </div>
    );
  }

  const orderType = getOrderTypeInfo(order);

  return (
    <div className="space-y-6">
      {/* Header: Número de orden, Estado, Tipo y Total */}
      <div className="flex items-start justify-between">
        {/* Izquierda: Número, badges de estado y tipo */}
        <div className="flex flex-col gap-2">
          {/* Número de orden */}
          <span className="text-xl font-bold text-slate-900">
            {formatOrderNumber(order.id)}
          </span>

          {/* Badges debajo del número */}
          <div
            className="flex items-center gap-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge de estado cliqueable */}
            <OrderStatusEditor
              orderId={order.id}
              currentStatus={order.status}
              onStatusChange={handleStatusChange}
            />

            {/* Badge de tipo (domicilio/recoger/en mesa) */}
            <span
              className={cn(
                categoryBadgeVariants({ variant: orderType.variant as any }),
                "text-xs"
              )}
            >
              {orderType.icon}
              <span>{orderType.label}</span>
            </span>
          </div>
        </div>

        {/* Derecha: Total */}
        <div className="text-right">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(total)}
          </p>
          {deliveryFee > 0 && (
            <p className="text-xs text-slate-500">
              Incluye domicilio: {formatCurrency(deliveryFee)}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Información del Cliente */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4" />
          Cliente
        </h4>
        <div className="bg-slate-50 rounded-card p-4 space-y-2">
          {order.customer?.name ? (
            <p className="font-medium text-slate-900">{order.customer.name}</p>
          ) : null}
          {order.customer?.phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              {order.customer.phoneNumber}
            </div>
          )}
          {!order.customer?.name && !order.customer?.phoneNumber && (
            <p className="text-sm text-slate-500">Información no disponible</p>
          )}
        </div>
      </div>

      {/* Dirección de Entrega */}
      {order.address && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Dirección de entrega
          </h4>
          <div className="bg-slate-50 rounded-card p-4">
            <p className="font-medium text-slate-900">{order.address.label}</p>
            <p className="text-sm text-slate-600 mt-1">
              {order.address.addressText}
            </p>
          </div>
        </div>
      )}

      {/* Items de la orden */}
      {order.items && order.items.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Productos ({order.items.length})
          </h4>
          <div className="bg-slate-50 rounded-card overflow-hidden">
            {order.items.map((item: OrderItem, index: number) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 ${
                  index !== order.items!.length - 1
                    ? "border-b border-slate-200"
                    : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">
                    {item.quantity}x {item.productName}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                  {/* Icono sutil para indicar falta de stock */}
                  <button
                    onClick={() => handleNoStock(item)}
                    className="text-slate-300 hover:text-amber-500 transition-colors"
                    title="Indicar falta de disponibilidad"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {/* Desglose de totales */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Domicilio</span>
                  <span className="text-slate-700">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <p className="font-semibold text-slate-900">Total</p>
                <p className="font-bold text-slate-900">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notas */}
      {order.notes && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Notas
          </h4>
          <div className="bg-amber-50 rounded-card p-4">
            <p className="text-sm text-amber-800">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Información de pago */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Información de pago
        </h4>
        <div
          className="flex items-center gap-4"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <PaymentStatusEditor
            orderId={order.id}
            paymentMethod={order.paymentMethod}
            currentStatus={order.paymentStatus}
          />
          {order.paymentMethod && (
            <span className="text-sm text-slate-600">
              Método: {order.paymentMethod}
            </span>
          )}
        </div>
      </div>

      {/* Historial de cambios - Solo para usuarios con permisos */}
      {canViewHistory && history && history.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Historial
          </h4>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <span className="text-slate-600">
                    {entry.fromStatus
                      ? `${STATUS_LABELS[entry.fromStatus]} → ${STATUS_LABELS[entry.toStatus]}`
                      : `Creado: ${STATUS_LABELS[entry.toStatus]}`}
                  </span>
                  {entry.notes && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {formatOrderDate(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog para confirmar falta de stock */}
      <Dialog open={showNoStockDialog} onOpenChange={setShowNoStockDialog}>
        <DialogContent className="sm:max-w-100 bg-white">
          <div className="flex flex-col items-center text-center p-5">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Producto sin disponibilidad
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              ¿Confirmas que <strong>{selectedItem?.productName}</strong> no
              está disponible? Esto enviará una notificación al cliente por
              WhatsApp.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="slate-outline"
                onClick={() => setShowNoStockDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="amber"
                onClick={confirmNoStock}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    </div>
  );
}
