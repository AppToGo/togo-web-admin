import type { OrderStatus } from "./order.types";

/** Top-level layout of the orders screen. */
export type BoardViewMode = "board" | "focus" | "list";

/** How much detail order cards show. */
export type CardDensity = "compact" | "regular";

/** Infinite-scroll state of the archive (Delivered) status, shared by every view. */
export interface ArchivePagination {
  status: OrderStatus;
  hasMore: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}
