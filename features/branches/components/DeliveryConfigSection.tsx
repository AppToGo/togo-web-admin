"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import type { DeliveryConfig, DeliveryFeeType, DistanceRange } from "../types";

interface DeliveryConfigSectionProps {
  value: DeliveryConfig | undefined;
  onChange: (config: DeliveryConfig) => void;
}

const DEFAULT_DISTANCE_RANGE: DistanceRange = {
  minKm: 0,
  maxKm: 5,
  fee: 0,
};

export function DeliveryConfigSection({
  value,
  onChange,
}: DeliveryConfigSectionProps) {
  const t = useTranslations("branches.settings.delivery");
  const tc = useTranslations("common");

  const config = value ?? { type: "FREE" as DeliveryFeeType };
  const [ranges, setRanges] = useState<DistanceRange[]>(
    config.distanceRanges ?? [{ ...DEFAULT_DISTANCE_RANGE }]
  );

  const handleTypeChange = (type: DeliveryFeeType) => {
    if (type === "FREE") {
      onChange({ type });
    } else if (type === "FLAT") {
      onChange({ type, flatFee: 0 });
    } else if (type === "DISTANCE") {
      onChange({ type, distanceRanges: ranges });
    }
  };

  const handleFlatFeeChange = (fee: string) => {
    const numFee = parseFloat(fee) || 0;
    onChange({ ...config, type: "FLAT", flatFee: numFee });
  };

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newRange: DistanceRange = {
      minKm: lastRange?.maxKm ?? 0,
      maxKm: (lastRange?.maxKm ?? 0) + 5,
      fee: 0,
    };
    const newRanges = [...ranges, newRange];
    setRanges(newRanges);
    onChange({ ...config, type: "DISTANCE", distanceRanges: newRanges });
  };

  const removeRange = (index: number) => {
    const newRanges = ranges.filter((_, i) => i !== index);
    setRanges(newRanges);
    onChange({ ...config, type: "DISTANCE", distanceRanges: newRanges });
  };

  const updateRange = (
    index: number,
    field: keyof DistanceRange,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const newRanges = ranges.map((range, i) =>
      i === index ? { ...range, [field]: numValue } : range
    );
    setRanges(newRanges);
    onChange({ ...config, type: "DISTANCE", distanceRanges: newRanges });
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de tarifa */}
        <div className="space-y-3">
          <Label>{t("feeType")}</Label>
          <RadioGroup
            value={config.type}
            onValueChange={(v: DeliveryFeeType) => handleTypeChange(v)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FREE" id="free" />
              <Label htmlFor="free" className="font-normal cursor-pointer">
                {t("types.free")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FLAT" id="flat" />
              <Label htmlFor="flat" className="font-normal cursor-pointer">
                {t("types.flat")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DISTANCE" id="distance" />
              <Label htmlFor="distance" className="font-normal cursor-pointer">
                {t("types.distance")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Tarifa plana */}
        {config.type === "FLAT" && (
          <div className="space-y-2">
            <Label htmlFor="flatFee">{t("flatFee")}</Label>
            <Input
              id="flatFee"
              type="number"
              min={0}
              step={100}
              value={config.flatFee ?? 0}
              onChange={(e) => handleFlatFeeChange(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        {/* Rangos de distancia */}
        {config.type === "DISTANCE" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("distanceRanges")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRange}
              >
                <Plus className="w-4 h-4 mr-1" />
                {tc("buttons.add")}
              </Button>
            </div>

            <div className="space-y-3">
              {ranges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">
                        {t("minKm")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={range.minKm}
                        onChange={(e) =>
                          updateRange(index, "minKm", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">
                        {t("maxKm")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={range.maxKm}
                        onChange={(e) =>
                          updateRange(index, "maxKm", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">
                        {t("fee")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={range.fee}
                        onChange={(e) =>
                          updateRange(index, "fee", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  {ranges.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRange(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
