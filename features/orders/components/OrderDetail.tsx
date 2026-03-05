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
} from "lucide-react";
import {
  useOrder,
  useOrderHistory,
  useUpdateOrderStatus,
} from "../hooks/useOrders";
import type { OrderStatus, OrderItem } from "../types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatCurrency,
  formatOrderDate,
  canCompleteOrder,
} from "../utils/order-status.utils";
import { categoryBadgeVariants } from "../styles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderDetailProps {
  orderId: string;
  onClose?: () => void;
}

export function OrderDetail({ orderId, onClose }: OrderDetailProps) {
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId);
  const { data: history, isLoading: isLoadingHistory } =
    useOrderHistory(orderId);
  const updateStatus = useUpdateOrderStatus();
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleStatusChange = useCallback(
    (newStatus: OrderStatus) => {
      if (!order) return;

      if (newStatus === "COMPLETED") {
        const validation = canCompleteOrder(order);
        if (!validation.valid) {
          setAlertMessage(
            validation.message || "No se puede completar la orden"
          );
          setShowPaymentAlert(true);
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

  const statusColors = useMemo(() => {
    if (!order) return STATUS_COLORS.DRAFT;
    return STATUS_COLORS[order.status];
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

  const nextStatuses: OrderStatus[] = [
    "IN_PROGRESS",
    "ON_THE_WAY",
    "COMPLETED",
  ].filter((s) => s !== order.status) as OrderStatus[];

  return (
    <div className="space-y-6">
      {/* Header: Estado, Tipo de entrega y Total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors.dot}`} />
          <div>
            <p className="text-sm text-slate-500">Estado</p>
            <p className={`font-semibold ${statusColors.text}`}>
              {STATUS_LABELS[order.status]}
            </p>
          </div>
        </div>
        {/* Tipo de entrega */}
        <div className="text-center">
          <p className="text-sm text-slate-500">Entrega</p>
          <p className="font-medium text-slate-900">
            {order.deliveryType === 'DELIVERY' || order.addressId
              ? 'Domicilio'
              : order.deliveryType === 'PICKUP'
              ? 'Recoger'
              : 'En mesa'}
          </p>
          {(order.deliveryType === 'DELIVERY' || order.addressId) && order.deliveryFee && order.deliveryFee > 0 && (
            <p className="text-xs text-slate-500">
              Domicilio: {formatCurrency(order.deliveryFee)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(order.totalAmount)}
          </p>
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
          <p className="font-medium text-slate-900">
            {order.customer?.name || "No disponible"}
          </p>
          {order.customer?.phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              {order.customer.phoneNumber}
            </div>
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
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">
                    {item.quantity}x {item.productName}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
                <p className="font-medium text-slate-900 text-sm">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
            {/* Desglose de totales */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-1">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-700">
                  {formatCurrency(order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0))}
                </span>
              </div>
              {/* Domicilio (solo si aplica) */}
              {(order.deliveryType === 'DELIVERY' || order.addressId) && order.deliveryFee && order.deliveryFee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Domicilio</span>
                  <span className="text-slate-700">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              {/* Total */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <p className="font-semibold text-slate-900">Total</p>
                <p className="font-bold text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de pago */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Información de pago
        </h4>
        <div className="flex items-center gap-4">
          <Badge
            variant="secondary"
            className={
              order.paymentStatus === "PAID"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }
          >
            {order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}
          </Badge>
          {order.paymentMethod && (
            <span className="text-sm text-slate-600">
              Método: {order.paymentMethod}
            </span>
          )}
        </div>
      </div>

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

      {/* Historial de cambios */}
      {history && history.length > 0 && (
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

      {/* Acciones de estado */}
      {nextStatuses.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Cambiar estado</h4>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  disabled={updateStatus.isPending}
                  className={
                    status === "COMPLETED"
                      ? "border-green-500 text-green-600"
                      : ""
                  }
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={updateStatus.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Alert de pago pendiente */}
      <Dialog open={showPaymentAlert} onOpenChange={setShowPaymentAlert}>
        <DialogContent className="max-w-sm">
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
              Acción no permitida
            </h3>
            <p className="text-sm text-slate-500 mb-4">{alertMessage}</p>
            <Button
              onClick={() => setShowPaymentAlert(false)}
              className="w-full"
            >
              Entendido
            </Button>
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
