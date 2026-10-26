"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PillGroup } from "@/components/ui/pill-group";
import { Switch } from "@/components/ui/switch";
import type { TipConfig } from "../types";
import { DEFAULT_TIP_CONFIG, TIP_PRESETS } from "../types";

interface TipConfigSectionProps {
  value: TipConfig | undefined;
  onChange: (config: TipConfig) => void;
}

/**
 * Propina voluntaria (mesa y mostrador).
 *
 * Mismo patrón que CounterConfigSection: un interruptor maestro y el %
 * sugerido que se precarga al cobrar en Caja y en el carrito del QR de
 * mesa. El cajero o el comensal pueden cambiarlo o quitarlo.
 */
export function TipConfigSection({ value, onChange }: TipConfigSectionProps) {
  const t = useTranslations("branches.settings.tip");

  const config = value ?? DEFAULT_TIP_CONFIG;
  // El 0 ("Sin propina") no tiene sentido como sugerido.
  const suggestedOptions = TIP_PRESETS.filter((p) => p > 0).map((p) => ({
    id: String(p),
    label: `${p} %`,
  }));

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription className="mt-1">{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <Label htmlFor="tip-enabled" className="font-medium cursor-pointer">
              {t("enable")}
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">{t("enableDescription")}</p>
          </div>
          <Switch
            id="tip-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => onChange({ ...config, enabled: checked })}
          />
        </div>

        {config.enabled && (
          <div className="space-y-2">
            <Label className="font-medium">{t("suggested")}</Label>
            <PillGroup
              label={t("suggested")}
              options={suggestedOptions}
              value={String(config.suggestedPercent)}
              onChange={(id) =>
                onChange({
                  ...config,
                  suggestedPercent: Number(id),
                  presets: [...TIP_PRESETS],
                })
              }
            />
            <p className="text-xs text-slate-500">{t("suggestedDescription")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
