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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { TransferOptions, TransferOption, TransferOptionType } from "../types";
import { DEFAULT_TRANSFER_OPTIONS } from "../types";

interface TransferOptionsSectionProps {
  value: TransferOptions | undefined;
  onChange: (config: TransferOptions) => void;
}

const EMPTY_OPTION: TransferOption = {
  type: "NEQUI",
  name: "",
  number: "",
  holder: "",
  additionalInfo: "",
};

const OPTION_TYPES: TransferOptionType[] = ["NEQUI", "DAVIPLATA", "BANK_ACCOUNT"];

export function TransferOptionsSection({
  value,
  onChange,
}: TransferOptionsSectionProps) {
  const t = useTranslations("branches.settings.transfer");
  const tc = useTranslations("common");

  const config = value ?? DEFAULT_TRANSFER_OPTIONS;

  const handleToggle = (enabled: boolean) => {
    onChange({ ...config, enabled });
  };

  const addOption = () => {
    if (config.options.length >= 5) return;
    onChange({ ...config, options: [...config.options, { ...EMPTY_OPTION }] });
  };

  const removeOption = (index: number) => {
    const newOptions = config.options.filter((_, i) => i !== index);
    onChange({ ...config, options: newOptions });
  };

  const updateOption = (
    index: number,
    field: keyof TransferOption,
    val: string
  ) => {
    const newOptions = config.options.map((opt, i) =>
      i === index ? { ...opt, [field]: val } : opt
    );
    onChange({ ...config, options: newOptions });
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription className="mt-1">{t("description")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="transfer-enabled"
              checked={config.enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="transfer-enabled" className="cursor-pointer text-sm">
              {t("enable")}
            </Label>
          </div>
        </div>
      </CardHeader>

      {config.enabled && (
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("accounts")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={config.options.length >= 5}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("addAccount")}
            </Button>
          </div>

          {config.options.length === 0 ? (
            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium">{t("noAccounts")}</p>
              <p className="text-xs mt-1">{t("noAccountsDescription")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.options.map((opt, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700 h-7 w-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">{t("accountType")}</Label>
                      <Select
                        value={opt.type}
                        onValueChange={(v: TransferOptionType) =>
                          updateOption(index, "type", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPTION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`types.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">{t("accountName")}</Label>
                      <Input
                        value={opt.name}
                        onChange={(e) => updateOption(index, "name", e.target.value)}
                        placeholder={t("placeholders.name")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">{t("accountNumber")}</Label>
                      <Input
                        value={opt.number}
                        onChange={(e) => updateOption(index, "number", e.target.value)}
                        placeholder={t("placeholders.number")}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">{t("accountHolder")}</Label>
                      <Input
                        value={opt.holder}
                        onChange={(e) => updateOption(index, "holder", e.target.value)}
                        placeholder={t("placeholders.holder")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">{t("accountAdditionalInfo")}</Label>
                    <Input
                      value={opt.additionalInfo ?? ""}
                      onChange={(e) =>
                        updateOption(index, "additionalInfo", e.target.value)
                      }
                      placeholder={t("placeholders.additionalInfo")}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {config.options.length >= 5 && (
            <p className="text-xs text-slate-500">{t("maxAccounts")}</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
