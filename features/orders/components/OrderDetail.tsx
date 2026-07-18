"use client";

import { OrderDetailContent, OrderDetailContentProps } from "./OrderDetailContent";

export interface OrderDetailProps extends OrderDetailContentProps {}

/**
 * OrderDetail component
 * 
 * Simple wrapper around OrderDetailContent for backward compatibility.
 * OrderDetailContent uses useTranslations directly and works in any route.
 */
export function OrderDetail(props: OrderDetailProps) {
  return <OrderDetailContent {...props} />;
}

// Re-export related components and types
export { OrderDetailContent } from "./OrderDetailContent";
export type { OrderDetailContentProps } from "./OrderDetailContent";
