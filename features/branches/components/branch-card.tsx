"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Edit2,
  Trash2,
  Star,
  Building2,
  MapPin,
  Phone,
  Hash,
  Smartphone,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Branch, RoutingMode } from "../types";

interface BranchCardProps {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
  onDelete?: (branch: Branch) => void;
  onMakeMain?: (branch: Branch) => void;
  isLoading?: boolean;
}

const routingModeConfig: Record<
  RoutingMode,
  { label: string; color: string; icon: typeof Route }
> = {
  DEDICATED: {
    label: "routingModes.dedicated",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Smartphone,
  },
  SINGLE_NUMBER: {
    label: "routingModes.singleNumber",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Route,
  },
};

export const BranchCard = memo(function BranchCard({
  branch,
  onEdit,
  onDelete,
  onMakeMain,
  isLoading = false,
}: BranchCardProps) {
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");

  const routingMode = routingModeConfig[branch.routingMode];
  const RoutingIcon = routingMode.icon;

  return (
    <Card
      variant="glass"
      className={cn(
        "group transition-all duration-200",
        !branch.isActive && "opacity-60 grayscale-[0.3]",
        branch.isMainBranch && "ring-2 ring-amber-400/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">
                {branch.name}
              </h3>
              {branch.isMainBranch && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                  <Star className="w-3 h-3 mr-1 fill-amber-600" />
                  {t("card.mainBranch")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
              <Hash className="w-3.5 h-3.5" />
              <span className="font-mono">{branch.code}</span>
            </div>
          </div>

          {/* Status Indicator */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
              branch.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                branch.isActive ? "bg-emerald-500" : "bg-slate-400"
              )}
            />
            {branch.isActive
              ? tCommon("status.active")
              : tCommon("status.inactive")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Routing Mode Badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border",
              routingMode.color
            )}
            title={t("routingMode")}
          >
            <RoutingIcon className="w-3.5 h-3.5" />
            {t(routingMode.label)}
          </span>
        </div>

        {/* Contact Info */}
        {branch.whatsappPhoneNumber && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{branch.whatsappPhoneNumber}</span>
          </div>
        )}

        {/* Address */}
        {branch.address && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{branch.address}</span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100/60 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{branch.timezone}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{branch.currency}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-slate-600 hover:text-slate-900"
            onClick={() => onEdit?.(branch)}
            disabled={isLoading}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            {tCommon("buttons.edit")}
          </Button>

          {!branch.isMainBranch && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              onClick={() => onMakeMain?.(branch)}
              disabled={isLoading}
            >
              <Star className="w-4 h-4 mr-1.5" />
              {t("card.makeMain")}
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete?.(branch)}
            disabled={isLoading || branch.isMainBranch}
            title={
              branch.isMainBranch
                ? t("card.cannotDeleteMain")
                : tCommon("buttons.delete")
            }
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {tCommon("buttons.delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
