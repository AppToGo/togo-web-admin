"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Shield,
  Users,
  Edit2,
  Trash2,
  Copy,
  Lock,
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
import type { OperatorProfile } from "../types";

interface OperatorProfileCardProps {
  profile: OperatorProfile;
  onEdit?: (profile: OperatorProfile) => void;
  onDelete?: (profile: OperatorProfile) => void;
  onClone?: (profile: OperatorProfile) => void;
  isLoading?: boolean;
}

export const OperatorProfileCard = memo(function OperatorProfileCard({
  profile,
  onEdit,
  onDelete,
  onClone,
  isLoading = false,
}: OperatorProfileCardProps) {
  const t = useTranslations("operatorProfiles");
  const tCommon = useTranslations("common");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const permissionCount = profile.permissions?.length || 0;
  const userCount = profile.userCount || 0;

  return (
    <Card
      variant="glass"
      className={cn(
        "group transition-all duration-200",
        isLoading && "opacity-60"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 truncate">
                  {profile.name}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{profile.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Permission Count Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            <Shield className="w-3 h-3 mr-1" />
            {t("card.permissions", { count: permissionCount })}
          </Badge>
        </div>

        {/* User Count */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {t("card.users", { count: userCount })}
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100/60 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>{t("card.created")}:</span>
            <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-slate-600 hover:text-slate-900"
            onClick={() => onEdit?.(profile)}
            disabled={isLoading}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            {tCommon("buttons.edit")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => onClone?.(profile)}
            disabled={isLoading}
          >
            <Copy className="w-4 h-4 mr-1.5" />
            {t("card.clone")}
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
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
              {t("delete.description", { name: profile.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete?.(profile);
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
