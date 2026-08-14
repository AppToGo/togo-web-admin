"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAYMENT_STATUS_COLORS } from "../../constants/billing-status";
import type { BusinessPaymentStatus } from "../../types/billing.types";

interface BillingStatusBadgeProps {
  status: BusinessPaymentStatus;
  className?: string;
}

export function BillingStatusBadge({ status, className }: BillingStatusBadgeProps) {
  const t = useTranslations("subscription.billing.status");

  return (
    <Badge variant="outline" className={cn(PAYMENT_STATUS_COLORS[status], className)}>
      {t(status)}
    </Badge>
  );
}
