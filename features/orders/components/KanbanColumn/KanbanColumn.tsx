"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Minimize2 } from "lucide-react";
import { OrderCard } from "../OrderCard";
import { HoverTooltip } from "../HoverTooltip";
import type { Order, OrderStatus } from "../../types";
import type { CardDensity } from "../OrderCard";
import { getColumnConfig } from "../../config/kanban-columns.config";
import {
  columnVariants,
  columnDragOverVariants,
  dotVariants,
  columnHeaderVariants,
  cardContainerDragOverVariants,
  counterTextVariants,
  counterTextDragOverVariants,
  emptyStateVariants,
  emptyStateDragOverVariants,
  emptyStateIconVariants,
  emptyStateIconDragOverVariants,
  emptyStateTextVariants,
  emptyStateTextDragOverVariants,
} from "./column.variants";

// Exported so OrdersKanbanBoard can subtract it from the expanded columns'
// width (otherwise they render narrower than they should whenever a sibling
// column is collapsed to a rail).
export const RAIL_WIDTH = 56;

export interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onOrderClick?: (orderId: string) => void;
  isLoading?: boolean;
  density?: CardDensity;
  flexBasis?: string;
  minWidth?: number;
  // Total count for display (falls back to orders.length if not provided)
  totalCount?: number;
  // Infinite scroll props for archive columns
  isArchive?: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  // Tour: data-tour-step value to apply to the first card wrapper
  firstCardTourStep?: string;
  // Column collapsed to a narrow rail (drag & drop still works)
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  status,
  orders,
  onStatusChange,
  onOrderClick,
  isLoading,
  density = "regular",
  flexBasis,
  minWidth = 320,
  totalCount,
  isArchive = false,
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
  firstCardTourStep,
  collapsed = false,
  onCollapsedChange,
}: KanbanColumnProps) {
  const t = useTranslations("orders");
  const [isDragOver, setIsDragOver] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Obtener configuración de la columna desde el dominio
  const config = getColumnConfig(status);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const orderId = e.dataTransfer.getData("orderId");
      const fromStatus = e.dataTransfer.getData("fromStatus");

      if (orderId && fromStatus !== status) {
        onStatusChange?.(orderId, status);
      }
    },
    [status, onStatusChange]
  );

  // IntersectionObserver for infinite scroll (archive columns only)
  useEffect(() => {
    if (!isArchive || !onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isArchive, hasMore, isFetchingNextPage, onLoadMore]);

  // Collapsed rail: a narrow column that still accepts drops, showing only
  // the status dot, the count and a vertical label. Clicking expands it;
  // dropping an order moves it here.
  if (collapsed) {
    return (
      <HoverTooltip content={t("actions.expandColumn")} side="right">
        <button
          type="button"
          aria-label={t("actions.expandColumn")}
          onClick={() => onCollapsedChange?.(false)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "shrink-0 h-[calc(100vh-200px)] flex flex-col items-center gap-3 py-4 rounded-3xl border transition-all duration-200",
            "bg-white/50 border-white/60 hover:bg-white/80",
            isDragOver && columnDragOverVariants({ status })
          )}
          style={{ flex: `0 0 ${RAIL_WIDTH}px`, minWidth: RAIL_WIDTH, maxWidth: RAIL_WIDTH }}
        >
          <div className={dotVariants({ status })} />
          <span
            className={cn(
              isDragOver
                ? counterTextDragOverVariants({ status })
                : counterTextVariants({ status })
            )}
          >
            {totalCount ?? orders.length}
          </span>
          <span
            className="text-xs font-semibold text-slate-600"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {t(`status.${config.title}`)}
          </span>
        </button>
      </HoverTooltip>
    );
  }

  return (
    <div
      className={cn(
        columnVariants({ status }),
        isDragOver && columnDragOverVariants({ status })
      )}
      style={{
        flex: flexBasis ? `1 1 ${flexBasis}` : "0 0 320px",
        minWidth: minWidth,
        maxWidth: flexBasis ? undefined : 320,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header de la columna */}
      <div className={columnHeaderVariants({ status })}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={dotVariants({ status })} />
            <h3 className="font-semibold text-sm text-slate-700">
              {t(`status.${config.title}`)}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                isDragOver
                  ? counterTextDragOverVariants({ status })
                  : counterTextVariants({ status })
              )}
            >
              {totalCount ?? orders.length}
            </span>
            {onCollapsedChange && (
              <HoverTooltip content={t("actions.collapseColumn")}>
                <button
                  type="button"
                  aria-label={t("actions.collapseColumn")}
                  onClick={() => onCollapsedChange(true)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/70 hover:text-slate-700 transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </HoverTooltip>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor de tarjetas */}
      <div
        className={cn(
          // No side padding on the column, just enough breathing room so the
          // overflow doesn't clip the cards' border/shadow.
          "flex-1 overflow-y-auto space-y-3 min-h-0 px-0.5 pb-2 scrollbar-thin transition-colors duration-200 rounded-lg",
          isDragOver && cardContainerDragOverVariants({ status })
        )}
      >
        {isLoading ? (
          <>
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
          </>
        ) : orders.length === 0 ? (
          <div
            className={cn(
              emptyStateVariants({ status }),
              isDragOver && emptyStateDragOverVariants({ status })
            )}
          >
            <div
              className={cn(
                emptyStateIconVariants({ status }),
                isDragOver && emptyStateIconDragOverVariants({ status })
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full transition-colors",
                  dotVariants({ status }),
                  !isDragOver && "opacity-30"
                )}
              />
            </div>
            <p
              className={cn(
                isDragOver
                  ? emptyStateTextDragOverVariants({ status })
                  : emptyStateTextVariants({ status })
              )}
            >
              {isDragOver ? "Suelta aquí" : "Sin órdenes"}
            </p>
          </div>
        ) : (
          <>
            {orders.map((order, index) => (
              <div
                key={order.id}
                data-tour-step={index === 0 && firstCardTourStep ? firstCardTourStep : undefined}
              >
                <OrderCard
                  order={order}
                  onStatusChange={onStatusChange}
                  onClick={() => onOrderClick?.(order.id)}
                  currentStatus={status}
                  density={density}
                />
              </div>
            ))}
            
            {/* Sentinel div for infinite scroll (archive columns only) */}
            {isArchive && (
              <div
                ref={sentinelRef}
                className="h-4 w-full"
                aria-hidden="true"
              />
            )}
            
            {/* Loading skeleton for next page (archive columns only) */}
            {isArchive && isFetchingNextPage && (
              <>
                <KanbanCardSkeleton />
                <KanbanCardSkeleton />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export function KanbanCardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-slate-100 p-4 space-y-3 shadow-card animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
        <div className="h-4 w-4 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-slate-100 rounded" />
      <div className="h-3 w-1/2 bg-slate-100 rounded" />
      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-3 w-12 bg-slate-100 rounded" />
          <div className="h-3 w-8 bg-slate-100 rounded" />
        </div>
        <div className="h-6 w-6 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}
