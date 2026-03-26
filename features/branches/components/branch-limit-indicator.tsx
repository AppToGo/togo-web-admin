"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { CanCreateBranchResponse } from "../types";

interface BranchLimitIndicatorProps {
  limitData: CanCreateBranchResponse;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  onUpgrade?: () => void;
  isLoading?: boolean;
}

export const BranchLimitIndicator = memo(function BranchLimitIndicator({
  limitData,
  plan,
  onUpgrade,
  isLoading = false,
}: BranchLimitIndicatorProps) {
  const t = useTranslations("branches");

  const percentage = Math.min(100, (limitData.current / limitData.max) * 100);
  const isAtLimit = limitData.remaining === 0;
  const isNearLimit = limitData.remaining <= 1 && !isAtLimit;
  const isBasicPlan = plan === "BASIC";

  const progressColor = isAtLimit
    ? "bg-red-600"
    : isNearLimit
      ? "bg-amber-500"
      : "bg-indigo-600";

  return (
    <Card
      variant={isAtLimit ? "elevated" : "glass"}
      className={cn(
        "transition-all duration-200",
        isAtLimit && "border-red-200 bg-red-50/50"
      )}
    >
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {t("limits.title")}
              </span>
              {isAtLimit && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  {t("limits.limitReached")}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-slate-900">
              {t("limits.usage", {
                current: limitData.current,
                max: limitData.max,
              })}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <Progress
              value={percentage}
              className={cn("h-2", progressColor)}
            />
          </div>

          {/* Status Message */}
          <div className="flex items-center justify-between">
            <p
              className={cn(
                "text-sm",
                isAtLimit
                  ? "text-red-600 font-medium"
                  : isNearLimit
                    ? "text-amber-600"
                    : "text-slate-500"
              )}
            >
              {isAtLimit
                ? t("limits.limitReachedMessage")
                : t("limits.remaining", { count: limitData.remaining })}
            </p>

            {/* Upgrade Button for BASIC plan */}
            {isBasicPlan && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUpgrade}
                disabled={isLoading}
                className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {t("limits.upgrade")}
              </Button>
            )}
          </div>

          {/* Upgrade Message for BASIC plan */}
          {isBasicPlan && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {t("limits.upgradeDescription")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
