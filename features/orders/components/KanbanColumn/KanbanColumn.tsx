"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { OrderCard } from "../OrderCard";
import type { Order, OrderStatus } from "../../types";
import type { CardViewMode } from "../OrderCard";
import { getColumnConfig } from "../../config/kanban-columns.config";
import { isArchiveStatus } from "../../constants/order-statuses";
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

export interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onOrderClick?: (orderId: string) => void;
  isLoading?: boolean;
  viewMode?: CardViewMode;
  flexBasis?: string;
  minWidth?: number;
  // Infinite scroll props for archive columns
  isArchive?: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  status,
  orders,
  onStatusChange,
  onOrderClick,
  isLoading,
  viewMode = "card",
  flexBasis,
  minWidth = 320,
  isArchive = false,
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
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
          <span
            className={cn(
              isDragOver
                ? counterTextDragOverVariants({ status })
                : counterTextVariants({ status })
            )}
          >
            {orders.length}
          </span>
        </div>
      </div>

      {/* Contenedor de tarjetas */}
      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-3 min-h-0 scrollbar-thin transition-colors duration-200 rounded-lg",
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
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={onStatusChange}
                onClick={() => onOrderClick?.(order.id)}
                currentStatus={status}
                viewMode={viewMode}
              />
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

function KanbanCardSkeleton() {
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
