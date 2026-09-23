"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OrderTypeBadge, PaymentStatusEditor, TimeBadge } from "./OrderCard";
import type { Order, OrderStatus } from "../types";
import { getColumnConfig } from "../config/kanban-columns.config";
import { dotVariants } from "../theme";
import { canCompleteOrder, formatCurrency } from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";

// "Next step" action per status — reuses the existing orders.actions labels
// (Accept / Mark ready / Deliver).
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; labelKey: string }>> = {
  CONFIRMED: { to: "IN_PROGRESS", labelKey: "actions.accept" },
  IN_PROGRESS: { to: "READY", labelKey: "actions.ready" },
  READY: { to: "COMPLETED", labelKey: "actions.deliver" },
};

// Literal class names (not built dynamically) so Tailwind picks them up.
const STATUS_STYLE: Partial<
  Record<OrderStatus, { pill: string; borderOver: string }>
> = {
  CONFIRMED: { pill: "bg-blue-100 text-blue-700", borderOver: "border-blue-400" },
  IN_PROGRESS: { pill: "bg-purple-100 text-purple-700", borderOver: "border-purple-400" },
  READY: { pill: "bg-amber-100 text-amber-700", borderOver: "border-amber-400" },
  COMPLETED: { pill: "bg-emerald-100 text-emerald-700", borderOver: "border-emerald-400" },
  CANCELLED: { pill: "bg-pink-100 text-pink-700", borderOver: "border-pink-400" },
};

// Fixed-width last column so the action button lines up across rows (and
// terminal rows, which have no button, keep the same layout).
const ROW_GRID_CLASS =
  "grid-cols-[64px_minmax(0,1.3fr)_minmax(0,1.2fr)_96px_120px_76px_132px]";

function orderTotal(order: Order): number {
  const fee = order.deliveryType === "DELIVERY" ? order.deliveryFee || 0 : 0;
  return order.totalAmount + fee;
}

interface ListRowProps {
  order: Order;
  status: OrderStatus;
  onOrderClick?: (orderId: string) => void;
  onMove: (order: Order, to: OrderStatus) => void;
}

function ListRow({ order, status, onOrderClick, onMove }: ListRowProps) {
  const t = useTranslations("orders");
  const next = NEXT_STEP[status];
  const itemsSummary = order.items?.length
    ? order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")
    : t("empty.noProducts");

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("orderId", order.id);
        e.dataTransfer.setData("fromStatus", status);
      }}
      onClick={() => onOrderClick?.(order.id)}
      className={cn(
        "grid items-center gap-4 px-4 py-2.5 border-t border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors",
        ROW_GRID_CLASS
      )}
    >
      <span className="font-bold text-sm text-slate-900 tabular-nums truncate">
        {formatOrderNumber(order.id, order.orderNumber)}
      </span>

      <div className="min-w-0 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-slate-800 truncate">
          {order.customer?.name || t("unknownCustomer")}
        </span>
        <span className="shrink-0">
          <OrderTypeBadge order={order} />
        </span>
      </div>

      <span className="text-xs text-slate-600 truncate" title={itemsSummary}>
        {itemsSummary}
      </span>

      <span className="font-bold text-[13px] text-slate-900 tabular-nums">
        {formatCurrency(orderTotal(order))}
      </span>

      <span className="text-xs text-slate-400">
        <PaymentStatusEditor
          orderId={order.id}
          paymentMethod={order.paymentMethod}
          currentStatus={order.paymentStatus}
        />
      </span>

      <TimeBadge order={order} currentStatus={status} />

      <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
        {/* Only the next step; styled like the former status button group. */}
        {next && (
          <button
            type="button"
            onClick={() => onMove(order, next.to)}
            className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 inline-flex items-center gap-1 whitespace-nowrap transition-colors"
          >
            {t(next.labelKey)}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ListGroupProps {
  status: OrderStatus;
  orders: Order[];
  defaultOpen: boolean;
  onOrderClick?: (orderId: string) => void;
  onMove: (order: Order, to: OrderStatus) => void;
  onDropOrder: (orderId: string, to: OrderStatus) => void;
}

function ListGroup({
  status,
  orders,
  defaultOpen,
  onOrderClick,
  onMove,
  onDropOrder,
}: ListGroupProps) {
  const t = useTranslations("orders");
  const [open, setOpen] = useState(defaultOpen);
  const [isDragOver, setIsDragOver] = useState(false);
  const style = STATUS_STYLE[status];

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/80 border transition-colors duration-200",
        isDragOver ? style?.borderOver ?? "border-indigo-300" : "border-slate-100"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const orderId = e.dataTransfer.getData("orderId");
        const fromStatus = e.dataTransfer.getData("fromStatus");
        if (orderId && fromStatus !== status) onDropOrder(orderId, status);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 h-11 text-left"
      >
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-400 transition-transform duration-150",
            !open && "-rotate-90"
          )}
        />
        <span className={cn("w-2 h-2 rounded-full", dotVariants({ status }))} />
        <span className="text-[13px] font-semibold text-slate-800">
          {t(`status.${getColumnConfig(status).title}`)}
        </span>
        <span
          className={cn(
            "min-w-6 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums",
            style?.pill ?? "bg-slate-100 text-slate-600"
          )}
        >
          {orders.length}
        </span>
      </button>

      {open &&
        (orders.length === 0 ? (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {t("empty.noOrders")}
          </div>
        ) : (
          orders.map((order) => (
            <ListRow
              key={order.id}
              order={order}
              status={status}
              onOrderClick={onOrderClick}
              onMove={onMove}
            />
          ))
        ))}
    </div>
  );
}

interface GroupedListViewProps {
  statuses: OrderStatus[];
  ordersByStatus: Partial<Record<OrderStatus, Order[]>>;
  onOrderClick?: (orderId: string) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

/**
 * "Grouped list" view: every order in one list, grouped into collapsible
 * sections per status. Each row is a grid (number, customer + type, items,
 * total, payment, elapsed time and a next-step action). No delivery address:
 * that only lives in the order detail.
 */
export function GroupedListView({
  statuses,
  ordersByStatus,
  onOrderClick,
  onStatusChange,
}: GroupedListViewProps) {
  const t = useTranslations("orders");

  // Same validation as the detail status editor: moving to Delivered needs
  // a confirmed payment and a ready order.
  const moveOrder = (order: Order, to: OrderStatus) => {
    if (!onStatusChange) return;
    if (to === "COMPLETED") {
      const validation = canCompleteOrder(order);
      if (!validation.valid) {
        toast.error(
          validation.message
            ? t(validation.message.replace(/^orders\./, ""))
            : t("errors.cannotComplete")
        );
        return;
      }
    }
    onStatusChange(order.id, to);
  };

  return (
    <div className="h-full min-h-0 overflow-auto scrollbar-thin pb-2">
      <div className="min-w-[860px] flex flex-col gap-2.5">
        {statuses.map((status, index) => (
          <ListGroup
            key={status}
            status={status}
            orders={ordersByStatus[status] || []}
            defaultOpen={index < 3}
            onOrderClick={onOrderClick}
            onMove={moveOrder}
            onDropOrder={(orderId, to) => onStatusChange?.(orderId, to)}
          />
        ))}
      </div>
    </div>
  );
}
