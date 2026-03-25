"use client";

/**
 * OrderDetail - Legacy compatibility wrapper
 * 
 * @deprecated Use OrderDetailContainer for new code within next-intl context,
 * or OrderDetailContent with translations for contexts without next-intl.
 * 
 * This component is kept for backward compatibility with existing code in orders routes.
 * It simply delegates to OrderDetailContainer.
 */

import { OrderDetailContainer, OrderDetailContainerProps } from "./OrderDetailContainer";

export interface OrderDetailProps extends OrderDetailContainerProps {}

/**
 * OrderDetail component - Backward compatibility wrapper
 * 
 * This is the original component used throughout the orders feature.
 * It now delegates to OrderDetailContainer which handles translation loading.
 * 
 * For use in contexts WITHOUT next-intl (e.g., customer routes), use:
 * - OrderDetailDialog with translations prop, or
 * - OrderDetailContent directly with translations prop
 */
export function OrderDetail(props: OrderDetailProps) {
  return <OrderDetailContainer {...props} />;
}

// Re-export all related components and types
export { OrderDetailContainer } from "./OrderDetailContainer";
export { OrderDetailContent } from "./OrderDetailContent";
export type { 
  OrderDetailContainerProps,
  OrderDetailTranslations 
} from "./OrderDetailContainer";
export type { OrderDetailContentProps } from "./OrderDetailContent";
