"use client";

/**
 * "Voz del asistente" (plan bot natural, T18): trato tú/usted, emojis y
 * nombre del asistente de WhatsApp, con una vista previa de tres mensajes
 * armada por la API con las plantillas reales del negocio. Se guarda aparte
 * del resto del formulario del negocio.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/hooks/useDebounce";
import { useBotVoicePreview, useUpdateBusiness } from "../hooks/useBusiness";
import type { BotVoice, Business } from "../types/business.types";

const ASSISTANT_NAME_MAX = 30;
const ASSISTANT_NAME_FORMAT = /^[\p{L}\p{N} .'-]*$/u;

function voiceOf(business: Business): BotVoice {
  return {
    address: business.botVoice?.address === "usted" ? "usted" : "tu",
    emojis: business.botVoice?.emojis !== false,
    assistantName: business.botVoice?.assistantName ?? "",
  };
}

/** `*negrita*` de WhatsApp, como se ve en el chat. */
function withWhatsAppBold(text: string) {
  return text
    .split(/(\*[^*\n]+\*)/g)
    .map((part, i) =>
      /^\*[^*\n]+\*$/.test(part) ? (
        <strong key={i}>{part.slice(1, -1)}</strong>
      ) : (
        part
      )
    );
}

/** Clave para montar de nuevo la tarjeta cuando cambia la voz guardada. */
export function botVoiceKey(business: Business): string {
  return JSON.stringify(voiceOf(business));
}

interface BotVoiceCardProps {
  business: Business;
}

export function BotVoiceCard({ business }: BotVoiceCardProps) {
  const tb = useTranslations("settings.business");
  const tc = useTranslations("common");
  const updateBusiness = useUpdateBusiness();

  // El estado arranca de la voz guardada; el padre monta la tarjeta con
  // `key={botVoiceKey(business)}`, así que al guardar se reinicia sola.
  const saved = voiceOf(business);
  const [voice, setVoice] = useState<BotVoice>(saved);

  const name = voice.assistantName ?? "";
  const nameError =
    name.length > ASSISTANT_NAME_MAX
      ? tb("botVoice.assistantName.tooLong", { max: ASSISTANT_NAME_MAX })
      : !ASSISTANT_NAME_FORMAT.test(name)
        ? tb("botVoice.assistantName.invalid")
        : null;

  const requested = useMemo<BotVoice>(
    () => ({
      address: voice.address,
      emojis: voice.emojis,
      assistantName: nameError ? "" : name.trim(),
    }),
    [voice.address, voice.emojis, name, nameError]
  );
  const previewVoice = useDebounce(requested, 400);
  const preview = useBotVoicePreview(business.id, previewVoice);

  const isDirty =
    voice.address !== saved.address ||
    voice.emojis !== saved.emojis ||
    name.trim() !== (saved.assistantName ?? "");

  const handleSave = async () => {
    if (nameError) return;
    try {
      await updateBusiness.mutateAsync({
        businessId: business.id,
        data: {
          botVoice: {
            address: voice.address,
            emojis: voice.emojis,
            assistantName: name.trim(),
          },
        },
      });
      toast.success(tb("botVoice.saveSuccess"));
    } catch {
      toast.error(tb("botVoice.saveError"));
    }
  };

  const messages = preview.data
    ? [
        preview.data.greeting,
        preview.data.productFound,
        preview.data.addedToCart,
      ]
    : [];

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-600" />
          {tb("botVoice.title")}
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          {tb("botVoice.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>{tb("botVoice.address.label")}</Label>
              <RadioGroup
                value={voice.address}
                onValueChange={(value) =>
                  setVoice((prev) => ({
                    ...prev,
                    address: value === "usted" ? "usted" : "tu",
                  }))
                }
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="tu" id="botVoice-tu" />
                  <Label htmlFor="botVoice-tu" className="font-normal">
                    {tb("botVoice.address.tu")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="usted" id="botVoice-usted" />
                  <Label htmlFor="botVoice-usted" className="font-normal">
                    {tb("botVoice.address.usted")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="botVoice-emojis" className="text-base">
                  {tb("botVoice.emojis.label")}
                </Label>
                <p className="text-sm text-slate-500">
                  {tb("botVoice.emojis.description")}
                </p>
              </div>
              <Switch
                id="botVoice-emojis"
                checked={voice.emojis}
                onCheckedChange={(checked) =>
                  setVoice((prev) => ({ ...prev, emojis: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="botVoice-name">
                {tb("botVoice.assistantName.label")}
              </Label>
              <Input
                id="botVoice-name"
                value={name}
                maxLength={ASSISTANT_NAME_MAX}
                placeholder={tb("botVoice.assistantName.placeholder")}
                onChange={(e) =>
                  setVoice((prev) => ({
                    ...prev,
                    assistantName: e.target.value,
                  }))
                }
              />
              {nameError ? (
                <p className="text-sm text-red-500">{nameError}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  {tb("botVoice.assistantName.description")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{tb("botVoice.preview.title")}</Label>
            <div
              className="space-y-2 rounded-lg bg-slate-50 p-4"
              aria-busy={preview.isFetching}
            >
              {preview.isError && (
                <p className="text-sm text-slate-500">
                  {tb("botVoice.preview.error")}
                </p>
              )}
              {!preview.isError && messages.length === 0 && (
                <p className="text-sm text-slate-500">
                  {tb("botVoice.preview.loading")}
                </p>
              )}
              {messages.map((text, i) => (
                <p
                  key={i}
                  className="max-w-[90%] whitespace-pre-line rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                >
                  {withWhatsAppBold(text)}
                </p>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {tb("botVoice.preview.note")}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || !!nameError || updateBusiness.isPending}
            isLoading={updateBusiness.isPending}
          >
            {tc("buttons.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
