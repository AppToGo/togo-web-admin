"use client";

import { useTranslations } from "next-intl";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

/** Insignia "Empezó prueba": el lead se registró tras el bot comercial. */
export function LeadTrialBadge({ className }: { className?: string }) {
  const t = useTranslations("admin-demo-leads");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700",
        className
      )}
    >
      <Rocket className="h-3 w-3" aria-hidden />
      {t("trial.badge")}
    </span>
  );
}
