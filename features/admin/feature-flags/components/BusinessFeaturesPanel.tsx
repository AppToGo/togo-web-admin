"use client";

/**
 * Funcionalidades de un negocio: cuáles tiene activas y switch para cambiarlas.
 * Se usa en la pestaña "Por negocio" y en el diálogo del listado de negocios.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { formatDate } from "@/lib/utils";
import type { FeatureKey } from "@/features/business-features/types";
import { useBulkUpdateFeatures, useBusinessFeatureStatus } from "../hooks/useFeatureFlags";
import { useFeatureLabels } from "../hooks/useFeatureLabels";
import { getDependents } from "../utils/dependencies";
import type { BusinessFeatureStatus } from "../types";

interface BusinessFeaturesPanelProps {
  businessId: string;
}

export function BusinessFeaturesPanel({ businessId }: BusinessFeaturesPanelProps) {
  const t = useTranslations("admin-feature-flags");
  const label = useFeatureLabels();
  const { data: features, isLoading } = useBusinessFeatureStatus(businessId);
  const bulkUpdate = useBulkUpdateFeatures();
  // Apagar algo de lo que dependen otras activas pide confirmación
  const [pendingDisable, setPendingDisable] = useState<{
    feature: BusinessFeatureStatus;
    dependents: FeatureKey[];
  } | null>(null);

  const nameOf = (key: FeatureKey) => {
    const feature = features?.find((f) => f.key === key);
    return feature ? label(feature).name : key;
  };

  const apply = (key: FeatureKey, enabled: boolean) => {
    bulkUpdate.mutate({ businessIds: [businessId], featureKeys: [key], enabled });
  };

  const handleToggle = (feature: BusinessFeatureStatus, enabled: boolean) => {
    if (!enabled && features) {
      const activeDependents = getDependents([feature.key], features).filter(
        (k) => features.find((f) => f.key === k)?.enabled
      );
      if (activeDependents.length > 0) {
        setPendingDisable({ feature, dependents: activeDependents });
        return;
      }
    }
    apply(feature.key, enabled);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const activeCount = features?.filter((f) => f.enabled).length ?? 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        {t("business.activeCount", { count: activeCount, total: features?.length ?? 0 })}
      </p>

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {features?.map((feature) => {
          const { name, description } = label(feature);
          return (
            <div key={feature.key} className="flex items-start gap-4 p-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{name}</span>
                  {feature.isDefault && (
                    <Badge variant="outline" className="text-[10px] text-slate-500">
                      {t("business.default")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{description}</p>
                {!feature.isDefault && feature.updatedAt && (
                  <p className="text-xs text-slate-400">
                    {t("business.changedBy", {
                      name: feature.updatedBy?.name ?? t("business.unknownUser"),
                      date: formatDate(feature.updatedAt, "short"),
                    })}
                  </p>
                )}
              </div>
              <Switch
                checked={feature.enabled}
                disabled={bulkUpdate.isPending}
                onCheckedChange={(value) => handleToggle(feature, value)}
                aria-label={name}
              />
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={pendingDisable !== null}
        onOpenChange={(open) => !open && setPendingDisable(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.disableTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisable &&
                t("confirm.cascade", {
                  feature: label(pendingDisable.feature).name,
                  features: pendingDisable.dependents.map(nameOf).join(", "),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDisable) apply(pendingDisable.feature.key, false);
                setPendingDisable(null);
              }}
            >
              {t("bulk.disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
