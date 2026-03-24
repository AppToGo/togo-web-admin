"use client";

import { useTranslations } from "next-intl";
import { useLazySection } from "../../../hooks/useLazySection";
import { useCustomerOrders } from "../../../hooks/useCustomer";
import { CustomerOrdersTable } from "../customer-orders-table";
import { OrdersSectionSkeleton } from "../skeletons/sections/orders-section-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

interface OrdersSectionProps {
  customerId: string;
}

export function OrdersSection({ customerId }: OrdersSectionProps) {
  const t = useTranslations("customers");
  const { ref, shouldLoad } = useLazySection("orders");
  
  const {
    data: orders,
    meta: ordersMeta,
    isLoading,
  } = useCustomerOrders(customerId, 1, 10, shouldLoad);

  return (
    <div ref={ref} className="h-full">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
            {t("detail.orders")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <OrdersSectionSkeleton />
          ) : (
            <CustomerOrdersTable
              orders={orders || []}
              totalCount={ordersMeta?.total || 0}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
