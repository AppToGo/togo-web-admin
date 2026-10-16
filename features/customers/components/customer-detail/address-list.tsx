"use client";

import { useState } from "react";
import { MapPin, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/features/dashboard/components/DashboardCardHeader";
import type { CustomerAddress } from "../../types";
import { useTranslations } from "next-intl";

interface AddressListProps {
  addresses: CustomerAddress[];
  maxVisible?: number;
  className?: string;
}

export function AddressList({
  addresses,
  maxVisible = 3,
  className,
}: AddressListProps) {
  const tc = useTranslations("common");
  const t = useTranslations("customers");
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  const visibleAddresses = showAllAddresses
    ? addresses
    : addresses.slice(0, maxVisible);

  const hasMoreAddresses = (addresses?.length ?? 0) > maxVisible;

  return (
    <Card variant="glass" className={className}>
      <DashboardCardHeader icon={MapPin} title={t("detail.addresses")} />
      <CardContent>
        <div className="space-y-2" id="address-list-container">
          {visibleAddresses.map((address) => (
            <div
              key={address.id}
              className="rounded-card bg-white/65 px-3.5 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {address.label}
                </span>
                {address.isDefault && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-0 bg-indigo-100 text-xs text-indigo-800"
                  >
                    {t("detail.default")}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-[13px] text-slate-600">
                {address.addressText}
              </p>
            </div>
          ))}
        </div>
        {hasMoreAddresses && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-slate-500"
            onClick={() => setShowAllAddresses(!showAllAddresses)}
            aria-expanded={showAllAddresses}
            aria-controls="address-list-container"
          >
            {showAllAddresses ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" aria-hidden="true" />
                {tc("buttons.showLess")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" aria-hidden="true" />
                {tc("buttons.showMore")}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
