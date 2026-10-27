"use client";

/**
 * Activación masiva: varios negocios × varias funcionalidades.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelector } from "@/components/ui/multi-selector";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useBusinesses } from "@/features/orders/hooks/useOrders";
import type { FeatureKey } from "@/features/business-features/types";
import { useBulkUpdateFeatures, useFeatureSummary } from "../hooks/useFeatureFlags";
import { useFeatureLabels } from "../hooks/useFeatureLabels";
import { getDependents, getIncludedRequirements } from "../utils/dependencies";

export function FeatureBulkPanel() {
  const t = useTranslations("admin-feature-flags");
  const label = useFeatureLabels();
  const { data: businesses, isLoading: isBusinessesLoading } = useBusinesses();
  const { data: summary, isLoading: isSummaryLoading } = useFeatureSummary();
  const bulkUpdate = useBulkUpdateFeatures();

  const [businessIds, setBusinessIds] = useState<string[]>([]);
  const [featureKeys, setFeatureKeys] = useState<FeatureKey[]>([]);
  const [pendingAction, setPendingAction] = useState<boolean | null>(null);

  const businessOptions = useMemo(
    () => (businesses ?? []).map((b) => ({ value: b.id, label: b.name })),
    [businesses]
  );

  const nameOf = (key: FeatureKey) => {
    const feature = summary?.find((f) => f.key === key);
    return feature ? label(feature).name : key;
  };

  const included = summary ? getIncludedRequirements(featureKeys, summary) : [];
  const dependents = summary ? getDependents(featureKeys, summary) : [];

  const toggleFeature = (key: FeatureKey, checked: boolean) => {
    setFeatureKeys((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key)
    );
  };

  const canSubmit = businessIds.length > 0 && featureKeys.length > 0;

  const handleConfirm = () => {
    if (pendingAction === null) return;
    bulkUpdate.mutate(
      { businessIds, featureKeys, enabled: pendingAction },
      { onSettled: () => setPendingAction(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">
          {t("bulk.businessesLabel")}
        </p>
        {isBusinessesLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <MultiSelector
            options={businessOptions}
            value={businessIds}
            onChange={setBusinessIds}
            placeholder={t("bulk.businessesPlaceholder")}
            searchPlaceholder={t("bulk.searchBusiness")}
            emptyMessage={t("bulk.noBusinesses")}
            selectAllLabel={t("bulk.selectAll")}
            clearAllLabel={t("bulk.clearAll")}
            showSelectAll
            showFooter
            icon={<Building2 className="h-4 w-4" />}
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">
          {t("bulk.featuresLabel")}
        </p>
        {isSummaryLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {summary?.map((feature) => {
              const { name, description } = label(feature);
              const checked = featureKeys.includes(feature.key);
              return (
                <label
                  key={feature.key}
                  className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggleFeature(feature.key, value === true)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">{name}</span>
                      <span className="text-xs text-slate-500">
                        {t("bulk.activeIn", {
                          count: feature.enabledCount,
                          total: feature.totalBusinesses,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{description}</p>
                    {!!(feature.requires?.length || feature.requiresAnyOf?.length) && (
                      <p className="mt-1 text-xs text-indigo-600">
                        {feature.requires?.length
                          ? t("requires", { features: feature.requires.map(nameOf).join(", ") })
                          : t("requiresAnyOf", {
                              features: (feature.requiresAnyOf ?? []).map(nameOf).join(` ${t("or")} `),
                            })}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          disabled={!canSubmit || bulkUpdate.isPending}
          onClick={() => setPendingAction(false)}
        >
          {t("bulk.disable")}
        </Button>
        <Button
          disabled={!canSubmit || bulkUpdate.isPending}
          onClick={() => setPendingAction(true)}
        >
          {t("bulk.enable")}
        </Button>
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? t("confirm.enableTitle") : t("confirm.disableTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {t("confirm.summary", {
                    businesses: businessIds.length,
                    features: featureKeys.length,
                  })}
                </p>
                <p className="font-medium text-slate-700">
                  {featureKeys.map(nameOf).join(", ")}
                </p>
                {pendingAction && included.length > 0 && (
                  <p className="text-indigo-600">
                    {t("confirm.alsoEnables", { features: included.map(nameOf).join(", ") })}
                  </p>
                )}
                {pendingAction === false && dependents.length > 0 && (
                  <p className="text-amber-600">
                    {t("confirm.mayDisable", { features: dependents.map(nameOf).join(", ") })}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdate.isPending}>
              {t("confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction disabled={bulkUpdate.isPending} onClick={handleConfirm}>
              {pendingAction ? t("bulk.enable") : t("bulk.disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
