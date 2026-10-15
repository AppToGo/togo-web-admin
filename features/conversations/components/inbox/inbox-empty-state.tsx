"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

export function InboxEmptyState() {
  const t = useTranslations("inbox");

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-card-xl border border-white/80 bg-white/45 px-6 text-center backdrop-blur-xl">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
        <MessageCircle className="h-8 w-8 text-indigo-500" />
      </div>
      <p className="font-semibold text-slate-900">{t("list.noSelectionTitle")}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{t("list.noSelection")}</p>
    </div>
  );
}
