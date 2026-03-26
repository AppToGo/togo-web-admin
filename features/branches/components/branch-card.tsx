"use client";

import { memo, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Branch, RoutingMode } from "../types";
import { getPrimaryWhatsApp } from "../utils/branch-helpers";

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
    label: "routingModes.DEDICATED.title",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Smartphone,
  },
  SINGLE_NUMBER: {
    label: "routingModes.SINGLE_NUMBER.title",
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        {(() => {
          const primaryNumber = getPrimaryWhatsApp(branch);
          return primaryNumber ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{primaryNumber}</span>
            </div>
          ) : null;
        })()}

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
            onClick={() => setShowDeleteConfirm(true)}
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete?.(branch);
              }}
            >
              {tCommon("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
