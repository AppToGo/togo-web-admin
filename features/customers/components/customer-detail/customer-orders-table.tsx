"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/features/orders/types";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";

interface CustomerOrdersTableProps {
  orders: Order[];
  totalCount: number;
}

export function CustomerOrdersTable({
  orders,
  totalCount,
}: CustomerOrdersTableProps) {
  const t = useTranslations("customers");
  const to = useTranslations("orders");

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Package className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          {t("detail.noOrders")}
        </h3>
        <p className="text-slate-500">{t("detail.noOrdersDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-slate-700 font-semibold">
                {t("detail.orders.orderId")}
              </TableHead>
              <TableHead className="text-slate-700 font-semibold">
                {t("detail.orders.date")}
              </TableHead>
              <TableHead className="text-slate-700 font-semibold">
                {t("detail.orders.status")}
              </TableHead>
              <TableHead className="text-slate-700 font-semibold">
                {t("detail.orders.payment")}
              </TableHead>
              <TableHead className="text-slate-700 font-semibold text-right">
                {t("detail.orders.amount")}
              </TableHead>
              <TableHead className="text-slate-700 font-semibold">
                <span className="sr-only">{t("detail.orders.actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-slate-50">
                <TableCell>
                  <span className="font-mono text-sm">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={order.paymentStatus === "PAID" ? "default" : "secondary"}
                  >
                    {order.paymentStatus === "PAID"
                      ? to("payment.paid")
                      : to("payment.pending")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                    <Link href={`/dashboard/orders?orderId=${order.id}`}>
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">
                        {t("detail.orders.viewOrder")}
                      </span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalCount > orders.length && (
        <p className="text-sm text-slate-500 text-center">
          {t("detail.orders.showing", {
            shown: orders.length,
            total: totalCount,
          })}
        </p>
      )}
    </div>
  );
}
