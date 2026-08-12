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
import type { DineInConfig } from "../types";
import { DEFAULT_DINE_IN_CONFIG } from "../types";

interface DineInConfigSectionProps {
  value: DineInConfig | undefined;
  onChange: (config: DineInConfig) => void;
}

/**
 * Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1).
 *
 * Mismo patrón que TransferOptionsSection: un toggle maestro (`enabled`)
 * que revela sub-opciones. Acá las sub-opciones son "quién puede pedir
 * mesa" (Regla 3) en vez de una lista de cuentas.
 */
export function DineInConfigSection({
  value,
  onChange,
}: DineInConfigSectionProps) {
  const t = useTranslations("branches.settings.dineIn");

  const config = value ?? DEFAULT_DINE_IN_CONFIG;

  const handleToggle = (field: keyof DineInConfig, checked: boolean) => {
    onChange({ ...config, [field]: checked });
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription className="mt-1">{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <Label htmlFor="dine-in-enabled" className="font-medium cursor-pointer">
              {t("enable")}
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">{t("enableDescription")}</p>
          </div>
          <Switch
            id="dine-in-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => handleToggle("enabled", checked)}
          />
        </div>

        {config.enabled && (
          <div className="space-y-3 pl-1">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label
                  htmlFor="dine-in-allow-customers"
                  className="font-medium cursor-pointer"
                >
                  {t("allowCustomers")}
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("allowCustomersDescription")}
                </p>
              </div>
              <Switch
                id="dine-in-allow-customers"
                checked={config.allowCustomers}
                onCheckedChange={(checked) => handleToggle("allowCustomers", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label
                  htmlFor="dine-in-allow-operators"
                  className="font-medium cursor-pointer"
                >
                  {t("allowOperators")}
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("allowOperatorsDescription")}
                </p>
              </div>
              <Switch
                id="dine-in-allow-operators"
                checked={config.allowOperators}
                onCheckedChange={(checked) => handleToggle("allowOperators", checked)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
