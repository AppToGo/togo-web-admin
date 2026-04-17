"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Edit2,
  Trash2,
  Star,
  Building2,
  MapPin,
  Hash,
  MessageCircle,
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
import type { Branch } from "../types";
import { useBranchMetrics } from "../hooks/useBranches";
import type {
  WhatsAppAccount,
  WhatsAppRouting,
} from "@/features/whatsapp/types";

interface BranchCardProps {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
  onConfigure?: (branch: Branch) => void;
  onDelete?: (branch: Branch) => void;
  onMakeMain?: (branch: Branch) => void;
  onConnectWhatsApp?: (branch: Branch) => void;
  whatsappAccount?: WhatsAppAccount | null;
  whatsappRouting?: WhatsAppRouting | null;
  isLoading?: boolean;
}

export const BranchCard = memo(function BranchCard({
  branch,
  onEdit,
  onConfigure,
  onDelete,
  onMakeMain,
  onConnectWhatsApp,
  whatsappAccount,
  whatsappRouting,
  isLoading = false,
}: BranchCardProps) {
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");
  const tWa = useTranslations("whatsapp");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: metrics } = useBranchMetrics(
    branch.isActive ? branch.id : null
  );

  const isWhatsAppConnected = !!whatsappRouting?.isActive && !!whatsappAccount;

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
              {isWhatsAppConnected && (
                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {whatsappAccount?.displayName ?? whatsappAccount?.phoneNumber}
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

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100/60">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">
                {metrics.ordersToday}
              </p>
              <p className="text-xs text-slate-500">
                {t("metrics.ordersToday")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {metrics.pendingOrders}
              </p>
              <p className="text-xs text-slate-500">{t("metrics.pending")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">
                {metrics.revenueToday.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {t("metrics.revenueToday")}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-slate-100 flex-wrap">
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

          {/* WhatsApp Connect / Edit button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onConnectWhatsApp?.(branch)}
            disabled={isLoading}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            {isWhatsAppConnected
              ? tWa("accounts.edit")
              : tWa("accounts.connect")}
          </Button>

          <div className="flex-1" />

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
