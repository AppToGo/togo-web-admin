"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PillGroup } from "@/components/ui/pill-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DemoFunnelAdRow, DemoFunnelChannel } from "@/types/auth.types";
import {
  FUNNEL_CHANNELS,
  bogotaDate,
  detectRangePreset,
  type FunnelRangePreset,
} from "@/features/admin/demo-leads/utils/funnel.utils";

const ALL = "ALL";
const DATE_INPUT_CLASS =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export interface LeadsFunnelFiltersProps {
  from: string | null;
  to: string | null;
  channel: DemoFunnelChannel | null;
  adKey: string | null;
  /** Anuncios disponibles (de `byAd`). */
  ads: DemoFunnelAdRow[];
  onRangeChange: (from: string | null, to: string | null) => void;
  onChannelChange: (channel: DemoFunnelChannel | null) => void;
  onAdChange: (adKey: string | null) => void;
}

export function LeadsFunnelFilters({
  from,
  to,
  channel,
  adKey,
  ads,
  onRangeChange,
  onChannelChange,
  onAdChange,
}: LeadsFunnelFiltersProps) {
  const t = useTranslations("admin-demo-leads");
  const preset = detectRangePreset(from, to);
  // "Personalizado" se queda abierto aunque aún no haya fechas elegidas.
  const [customOpen, setCustomOpen] = useState(preset === "custom");
  const showCustom = customOpen || preset === "custom";
  const activePreset: FunnelRangePreset = showCustom ? "custom" : preset;

  const pickPreset = (value: FunnelRangePreset) => {
    if (value === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    onRangeChange(bogotaDate(value === "7" ? 6 : 29), bogotaDate());
  };

  const channelValue = channel ?? ALL;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      <PillGroup<FunnelRangePreset>
        label={t("funnel.filters.range")}
        appearance="glass"
        value={activePreset}
        onChange={pickPreset}
        options={[
          { id: "7", label: t("funnel.filters.days7") },
          { id: "30", label: t("funnel.filters.days30") },
          { id: "custom", label: t("funnel.filters.custom") },
        ]}
      />
      {showCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
            {t("funnel.filters.from")}
            <input
              type="date"
              className={DATE_INPUT_CLASS}
              value={from ?? ""}
              max={to ?? undefined}
              onChange={(e) => onRangeChange(e.target.value || null, to)}
            />
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
            {t("funnel.filters.to")}
            <input
              type="date"
              className={DATE_INPUT_CLASS}
              value={to ?? ""}
              min={from ?? undefined}
              onChange={(e) => onRangeChange(from, e.target.value || null)}
            />
          </label>
        </div>
      )}
      <PillGroup<string>
        label={t("funnel.filters.channel")}
        appearance="glass"
        value={channelValue}
        onChange={(value) =>
          onChannelChange(value === ALL ? null : (value as DemoFunnelChannel))
        }
        options={[
          { id: ALL, label: t("funnel.filters.allChannels") },
          ...FUNNEL_CHANNELS.map((c) => ({
            id: c as string,
            label: t(`funnel.channels.${c}`),
          })),
        ]}
      />
      <Select
        value={adKey ?? ALL}
        onValueChange={(value) => onAdChange(value === ALL ? null : value)}
      >
        <SelectTrigger
          aria-label={t("funnel.filters.ad")}
          className="h-9 w-full rounded-full border-white/90 bg-white/75 text-[13px] lg:w-64"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("funnel.filters.allAds")}</SelectItem>
          {ads.map((ad) => (
            <SelectItem key={ad.adKey} value={ad.adKey}>
              {ad.adHeadline ?? t("funnel.filters.noHeadline")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
