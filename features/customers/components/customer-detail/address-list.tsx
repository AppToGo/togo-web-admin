"use client";

import { useState } from "react";
import { Building, MapPin, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Building className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {t("detail.addresses")}
          <span className="text-xs text-slate-400">
            ({addresses?.length ?? 0})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2" id="address-list-container">
          {visibleAddresses.map((address, index) => (
            <div
              key={address.id}
              className={`p-2.5 ${index === 0 ? "" : "pt-4.5 border-t-2 border-slate-100"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 text-sm">
                  {address.label}
                </span>
                {address.isDefault && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    {t("detail.default")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                <MapPin
                  className="h-3 w-3 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
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
