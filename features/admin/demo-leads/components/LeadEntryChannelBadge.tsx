"use client";

import { useTranslations } from "next-intl";
import {
  Megaphone,
  MessageSquare,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoEntryChannel } from "@/types/auth.types";

/**
 * Icono y colores de cada canal de entrada: la etiqueta de la tarjeta usa
 * `badge` (fondo + texto) y la ficha `text`. Un solo mapa para que no diverjan.
 */
export const LEAD_ENTRY_CHANNEL_STYLE: Record<
  DemoEntryChannel,
  { icon: LucideIcon; badge: string; text: string }
> = {
  AD: { icon: Megaphone, badge: "bg-amber-50 text-amber-700", text: "text-amber-700" },
  WEB: { icon: MonitorSmartphone, badge: "bg-sky-50 text-sky-700", text: "text-sky-700" },
  DIRECT: { icon: MessageSquare, badge: "bg-slate-100 text-slate-600", text: "text-slate-600" },
};

/** Estilo del canal; uno desconocido (API más nueva que el admin) usa el de directo. */
export function leadEntryChannelStyle(channel: DemoEntryChannel) {
  return LEAD_ENTRY_CHANNEL_STYLE[channel] ?? LEAD_ENTRY_CHANNEL_STYLE.DIRECT;
}

/**
 * Por dónde llegó el posible cliente: anuncio, web o mensaje directo.
 * Un canal desconocido se muestra como directo.
 */
export function LeadEntryChannelBadge({
  channel,
  adHeadline,
  className,
}: {
  channel: DemoEntryChannel;
  adHeadline?: string | null;
  className?: string;
}) {
  const t = useTranslations("admin-demo-leads");
  const known = channel in LEAD_ENTRY_CHANNEL_STYLE;
  const style = leadEntryChannelStyle(channel);
  const Icon = style.icon;
  const label = t(`entryChannels.${known ? channel : "DIRECT"}`);
  // En anuncios, el titular completo queda en el tooltip.
  const title =
    channel === "AD" && adHeadline
      ? t("detail.adHeadline", { headline: adHeadline })
      : t("detail.entryChannelLabel", { channel: label });

  return (
    <span
      title={title}
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
