"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConversationOutcome, ConversationStatus } from "../types";

interface ConversationOutcomeBadgeProps {
  outcome: ConversationOutcome | null;
  status: ConversationStatus;
  className?: string;
}

/**
 * Mapa de config por valor, siguiendo `order-status-badge.tsx` — pero con
 * labels vía `t()`, no hardcodeados (esa es la inconsistencia de ese
 * archivo que este componente evita repetir).
 */
const outcomeClassName: Record<ConversationOutcome, string> = {
  ORDER_PLACED: "bg-emerald-100 text-emerald-700",
  ABANDONED: "bg-amber-100 text-amber-700",
  SUPPORT: "bg-blue-100 text-blue-700",
  NO_INTENT: "bg-slate-100 text-slate-600",
  SPAM: "bg-red-100 text-red-700",
};

export function ConversationOutcomeBadge({
  outcome,
  status,
  className,
}: ConversationOutcomeBadgeProps) {
  const t = useTranslations("conversations");

  // outcome sólo se calcula al cerrar la sesión (24h de inactividad) — una
  // sesión OPEN nunca lo tiene todavía, así que se muestra el status en su
  // lugar en vez de un badge vacío.
  if (!outcome) {
    return (
      <Badge
        variant="outline"
        className={cn("bg-indigo-50 text-indigo-600", className)}
      >
        {t(`status.${status}`)}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(outcomeClassName[outcome], className)}
    >
      {t(`outcome.${outcome}`)}
    </Badge>
  );
}
