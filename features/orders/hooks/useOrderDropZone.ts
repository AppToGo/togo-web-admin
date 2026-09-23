"use client";

import { useState, type DragEvent } from "react";
import type { OrderStatus } from "../types";

/**
 * Drop target for dragged order cards (they set "orderId" / "fromStatus" on
 * dataTransfer). Shared by the "By status" tabs and the grouped list so both
 * behave the same; `dragleave` ignores moves into child elements to avoid
 * highlight flicker.
 */
export function useOrderDropZone(
  status: OrderStatus,
  onDropOrder: (orderId: string, toStatus: OrderStatus) => void
) {
  const [isDragOver, setIsDragOver] = useState(false);

  const dropHandlers = {
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (!isDragOver) setIsDragOver(true);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragOver(false);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const orderId = e.dataTransfer.getData("orderId");
      const fromStatus = e.dataTransfer.getData("fromStatus");
      if (orderId && fromStatus !== status) onDropOrder(orderId, status);
    },
  };

  return { isDragOver, dropHandlers };
}
