"use client";

import * as React from "react";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export function FreePlanBanner() {
  const t = useTranslations("dashboard.freePlanBanner");

  return (
    <div className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <Zap className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-900">{t("title")}</p>
          <p className="text-xs text-indigo-600">{t("subtitle")}</p>
        </div>
      </div>
      <button
        type="button"
        className="flex-shrink-0 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
      >
        {t("cta")}
      </button>
    </div>
  );
}
