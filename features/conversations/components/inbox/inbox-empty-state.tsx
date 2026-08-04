"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

export function InboxEmptyState() {
  const t = useTranslations("inbox");

  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <MessageCircle className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500">{t("list.noSelection")}</p>
    </div>
  );
}
