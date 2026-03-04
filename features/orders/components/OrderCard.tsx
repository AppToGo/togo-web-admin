"use client";

import { memo, useCallback, useState } from "react";
import { Clock, Calendar, MessageSquare, Paperclip } from "lucide-react";
import type { Order } from "../types";
import {
  formatCurrency,
  getTimeElapsed,
  canCompleteOrder,
  STATUS_LABELS,
} from "../utils/order-status.utils";
import {
  kanbanCardVariants,
  categoryBadgeVariants,
  avatarVariants,
} from "../styles";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "./OrderDetail";

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  badgeVariant?: string;
}

// Gradientes de avatar predefinidos
const AVATAR_GRADIENTS = [
  "bg-gradient-pink-purple",
  "bg-gradient-purple-indigo",
  "bg-gradient-blue-cyan",
  "bg-gradient-emerald-teal",
  "bg-gradient-orange-amber",
];

export const OrderCard = memo(function OrderCard({
  order,
  onStatusChange,
  badgeVariant = "slate",
}: OrderCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);

  const customerName = order.customer?.name || "Cliente";
  const itemsCount = order.items?.length || 0;
  const timeElapsed = getTimeElapsed(order.createdAt);

  // Generar iniciales para el avatar
  const initials = customerName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Seleccionar gradiente basado en el nombre
  const avatarGradient =
    AVATAR_GRADIENTS[customerName.length % AVATAR_GRADIENTS.length];

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

  return (
    <>
      <div
        className={cn(
          kanbanCardVariants({ elevation: "default" }),
          "animate-cardEnter hover:animate-cardHover"
        )}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Badge de categoría */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={categoryBadgeVariants({ variant: badgeVariant as any })}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <button
            className="text-slate-400 hover:text-slate-600 p-1 rounded-icon hover:bg-slate-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </button>
        </div>

        {/* Título/Nombre del cliente */}
        <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">
          {customerName}
        </h4>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{timeElapsed}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{itemsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            <span>{order.paymentStatus === "PAID" ? "1" : "0"}</span>
          </div>
        </div>

        {/* Footer: Avatar y precio */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100/80">
          {/* Avatar con iniciales */}
          <div
            className={cn(
              avatarVariants({ size: "default" }),
              avatarGradient,
              "flex items-center justify-center text-white text-xs font-medium"
            )}
          >
            {initials}
          </div>

          {/* Precio */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Dialog de detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
