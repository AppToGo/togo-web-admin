"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useFormatDate } from "@/hooks/useFormatDate";
import type { OwnerPaymentRecord } from "../../types/billing.types";

interface PaymentHistoryTableProps {
  payments: OwnerPaymentRecord[] | undefined;
  isLoading: boolean;
  currency: string;
}

function PaymentRow({ payment, currency }: { payment: OwnerPaymentRecord; currency: string }) {
  const paidAt = useFormatDate(payment.paidAt, { preset: "short" });

  return (
    <TableRow>
      <TableCell>{paidAt}</TableCell>
      <TableCell className="font-medium">{formatCurrency(Number(payment.amount), currency)}</TableCell>
      <TableCell>{payment.method}</TableCell>
      <TableCell className="text-slate-500">{payment.reference ?? "—"}</TableCell>
    </TableRow>
  );
}

export function PaymentHistoryTable({ payments, isLoading, currency }: PaymentHistoryTableProps) {
  const t = useTranslations("subscription.billing");

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("paymentHistory.title")}</CardTitle>
        <CardDescription>{t("paymentHistory.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !payments || payments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">{t("paymentHistory.empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("paymentHistory.columns.paidAt")}</TableHead>
                <TableHead>{t("paymentHistory.columns.amount")}</TableHead>
                <TableHead>{t("paymentHistory.columns.method")}</TableHead>
                <TableHead>{t("paymentHistory.columns.reference")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} currency={currency} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
