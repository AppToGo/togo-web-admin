"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { OrderCard } from "./OrderCard";
import type { CardDensity } from "./OrderCard";
import type { ArchivePagination, Order, OrderStatus } from "../types";
import { getColumnConfig } from "../config/kanban-columns.config";
import { dotVariants } from "../theme";
import { getLatenessLevel, getOldestElapsedMinutes } from "../utils/order-lateness.utils";
import { useOrderDropZone } from "../hooks/useOrderDropZone";
import { KanbanCardSkeleton } from "./KanbanColumn";

const LOADING_CARDS = 3;

interface FocusTabProps {
  status: OrderStatus;
  label: string;
  count: number;
  oldestMinutes: number | null;
  active: boolean;
  onPick: () => void;
  onDropOrder: (orderId: string, toStatus: OrderStatus) => void;
}

function FocusTab({
  status,
  label,
  count,
  oldestMinutes,
  active,
  onPick,
  onDropOrder,
}: FocusTabProps) {
  const t = useTranslations("orders");
  const { isDragOver, dropHandlers } = useOrderDropZone(status, onDropOrder);

  return (
    <button
      type="button"
      onClick={onPick}
      {...dropHandlers}
      className={cn(
        "relative text-left rounded-2xl px-3 py-2 border-2 transition-all duration-200",
        active || isDragOver
          ? "bg-white shadow-card border-indigo-200"
          : "bg-white/60 hover:bg-white/80 border-transparent"
      )}
    >
      {/* Compact tab: dot + count, with the status name and oldest-order time
          stacked next to it. */}
      <div className="flex items-center gap-2.5">
        <span className={cn("w-2 h-2 rounded-full shrink-0", dotVariants({ status }))} />
        <span className="text-[26px] font-bold tracking-tight text-slate-900 tabular-nums leading-none shrink-0">
          {count}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-600 truncate">{label}</span>
          {oldestMinutes !== null && (
            <span
              className={cn(
                "text-[11px] font-medium",
                getLatenessLevel(oldestMinutes) === "critical"
                  ? "text-red-600"
                  : "text-slate-500"
              )}
            >
              +{t("elapsedMinutes", { count: oldestMinutes })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface FocusViewProps {
  statuses: OrderStatus[];
  ordersByStatus: Partial<Record<OrderStatus, Order[]>>;
  activeStatus: OrderStatus;
  onActiveStatusChange: (status: OrderStatus) => void;
  onOrderClick?: (orderId: string) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  density: CardDensity;
  /** Per-status totals from metrics (not affected by search/filters) — same
   * source the Board column headers use. */
  totalCounts?: Partial<Record<OrderStatus, number>>;
  isStatusLoading?: (status: OrderStatus) => boolean;
  archive?: ArchivePagination;
  /** Tour: data-tour-step for the first card of the active status. */
  firstCardTourStep?: string;
}

/**
 * "By status" view: focuses on a single status with its orders in a grid.
 * The tabs also accept a dropped card to move it straight to that status,
 * just like the board columns.
 */
export function FocusView({
  statuses,
  ordersByStatus,
  activeStatus,
  onActiveStatusChange,
  onOrderClick,
  onStatusChange,
  density,
  totalCounts,
  isStatusLoading,
  archive,
  firstCardTourStep,
}: FocusViewProps) {
  const t = useTranslations("orders");

  const activeOrders = ordersByStatus[activeStatus] || [];
  const isLoading = isStatusLoading?.(activeStatus) ?? false;
  const canLoadMore = archive?.status === activeStatus && archive.hasMore && activeOrders.length > 0;

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      {/* Column count depends on how many statuses are visible, so it can't be a static class. */}
      <div
        className="grid gap-2.5 shrink-0"
        style={{ gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))` }}
      >
        {statuses.map((status) => {
          const list = ordersByStatus[status] || [];
          const oldestMinutes = getOldestElapsedMinutes(list);
          return (
            <FocusTab
              key={status}
              status={status}
              label={t(`status.${getColumnConfig(status).title}`)}
              count={totalCounts?.[status] ?? list.length}
              oldestMinutes={oldestMinutes}
              active={activeStatus === status}
              onPick={() => onActiveStatusChange(status)}
              onDropOrder={(orderId, toStatus) => onStatusChange?.(orderId, toStatus)}
            />
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pb-2">
        {isLoading && activeOrders.length === 0 ? (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
            {Array.from({ length: LOADING_CARDS }).map((_, i) => (
              <KanbanCardSkeleton key={i} />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center rounded-2xl border-2 border-dashed border-slate-200/70">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <span className={cn("w-2 h-2 rounded-full", dotVariants({ status: activeStatus }))} />
            </span>
            <p className="text-sm text-slate-500">{t("empty.noOrders")}</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
            {activeOrders.map((order, index) => (
              <div key={order.id} data-tour-step={index === 0 ? firstCardTourStep : undefined}>
                <OrderCard
                  order={order}
                  onStatusChange={onStatusChange}
                  onClick={() => onOrderClick?.(order.id)}
                  currentStatus={activeStatus}
                  density={density}
                />
              </div>
            ))}
          </div>
        )}
        {canLoadMore && (
          <div className="flex justify-center pt-3">
            <button
              type="button"
              onClick={archive.onLoadMore}
              disabled={archive.isFetchingNextPage}
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-white/70 text-slate-600 hover:bg-white disabled:opacity-60 transition-colors"
            >
              {t("actions.loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
