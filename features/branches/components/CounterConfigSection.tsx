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
import { Switch } from "@/components/ui/switch";
import type { CounterConfig } from "../types";
import { DEFAULT_COUNTER_CONFIG } from "../types";

interface CounterConfigSectionProps {
  value: CounterConfig | undefined;
  onChange: (config: CounterConfig) => void;
}

/**
 * Venta de mostrador (docs/caja-pedidos.md).
 *
 * Mismo patrón que DineInConfigSection, con un solo interruptor: al
 * activarlo, "Nuevo pedido" ofrece el tipo "Mostrador" en esta sede
 * (crea, cobra, liquida en caja y entrega en un paso).
 */
export function CounterConfigSection({ value, onChange }: CounterConfigSectionProps) {
  const t = useTranslations("branches.settings.counter");

  const config = value ?? DEFAULT_COUNTER_CONFIG;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription className="mt-1">{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <Label htmlFor="counter-enabled" className="font-medium cursor-pointer">
              {t("enable")}
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">{t("enableDescription")}</p>
          </div>
          <Switch
            id="counter-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => onChange({ ...config, enabled: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
