"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

export function InboxWindowNotice() {
  const t = useTranslations("inbox");

  return (
    <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-medium text-amber-800">
          {t("composer.windowClosedTitle")}
        </p>
        <p className="text-xs text-amber-700">{t("composer.windowClosedDescription")}</p>
      </div>
    </div>
  );
}
