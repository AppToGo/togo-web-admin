"use client";

import { useTranslations } from "next-intl";
import {
  Compass,
  Globe,
  MessageCircle,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoLeadSource } from "@/types/auth.types";

/**
 * Icono y colores de cada origen: la etiqueta de la tarjeta usa `badge`
 * (fondo + texto) y la ficha `text`. Un solo mapa para que no diverjan.
 */
export const LEAD_SOURCE_STYLE: Record<
  DemoLeadSource,
  { icon: LucideIcon; badge: string; text: string }
> = {
  DEMO: { icon: Globe, badge: "bg-indigo-50 text-indigo-700", text: "text-indigo-700" },
  WHATSAPP: { icon: MessageCircle, badge: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" },
  MANUAL: { icon: PenLine, badge: "bg-violet-50 text-violet-700", text: "text-violet-700" },
  SCOUT: { icon: Compass, badge: "bg-teal-50 text-teal-700", text: "text-teal-700" },
};

/** Estilo del origen; uno desconocido (API más nueva que el admin) usa el de la demo web. */
export function leadSourceStyle(source: DemoLeadSource) {
  return LEAD_SOURCE_STYLE[source] ?? LEAD_SOURCE_STYLE.DEMO;
}

/**
 * Cómo se creó el registro del posible cliente: demo web, WhatsApp de la
 * demo, a mano o ToGo Scout. Un origen desconocido (API más nueva que el
 * admin) cae en el estilo de la demo web con el código tal cual.
 */
export function LeadSourceBadge({
  source,
  className,
}: {
  source: DemoLeadSource;
  className?: string;
}) {
  const t = useTranslations("admin-demo-leads");
  const style = leadSourceStyle(source);
  const Icon = style.icon;
  const label = t.has(`sources.${source}`) ? t(`sources.${source}`) : source;

  return (
    <span
      title={t("detail.sourceLabel", { source: label })}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
        style.badge,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
