"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "../types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  DRAFT: {
    label: "Borrador",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700",
  },
  CONFIRMED: {
    label: "Nueva",
    variant: "default",
    className: "bg-blue-100 text-blue-700",
  },
  PAYMENT_PENDING: {
    label: "Pago Pendiente",
    variant: "secondary",
    className: "bg-amber-100 text-amber-700",
  },
  PAID: {
    label: "Pagado",
    variant: "default",
    className: "bg-emerald-100 text-emerald-700",
  },
  IN_PROGRESS: {
    label: "En Preparación",
    variant: "default",
    className: "bg-purple-100 text-purple-700",
  },
  READY: {
    label: "Listo",
    variant: "default",
    className: "bg-cyan-100 text-cyan-700",
  },
  ON_THE_WAY: {
    label: "En Camino",
    variant: "default",
    className: "bg-indigo-100 text-indigo-700",
  },
  COMPLETED: {
    label: "Completado",
    variant: "default",
    className: "bg-green-100 text-green-700",
  },
  CANCELLED: {
    label: "Cancelado",
    variant: "destructive",
    className: "bg-red-100 text-red-700",
  },
  ABANDONED: {
    label: "Abandonado",
    variant: "outline",
    className: "bg-gray-100 text-gray-700",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
