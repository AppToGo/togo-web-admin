"use client";

import { useTranslations } from "next-intl";
import { useLazySection } from "../../../hooks/useLazySection";
import { useCustomerOrders } from "../../../hooks/useCustomer";
import { CustomerOrdersList } from "../customer-orders-list";
import { OrdersSectionSkeleton } from "../skeletons/sections/orders-section-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import { ShoppingBag } from "lucide-react";

interface OrdersSectionProps {
  customerId: string;
}

export function OrdersSection({ customerId }: OrdersSectionProps) {
  const t = useTranslations("customers");
  const { ref, shouldLoad } = useLazySection(customerId, "orders");

  const {
    data: orders,
    meta: ordersMeta,
    isLoading,
  } = useCustomerOrders(customerId, 1, 10, shouldLoad);

  return (
    <div ref={ref}>
      <Card variant="glass">
        <DashboardCardHeader icon={ShoppingBag} title={t("detail.orderHistory")} />
        <CardContent>
          {isLoading ? (
            <OrdersSectionSkeleton />
          ) : (
            <CustomerOrdersList
              orders={orders || []}
              totalCount={ordersMeta?.total || 0}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
