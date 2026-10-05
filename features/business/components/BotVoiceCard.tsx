"use client";

/**
 * "Voz del asistente" (plan bot natural, T18): trato tú/usted, emojis y
 * nombre del asistente de WhatsApp, con una vista previa de tres mensajes
 * armada por la API con las plantillas reales del negocio. Se guarda aparte
 * del resto del formulario del negocio.
 *
 * T21: interruptor para que la IA reescriba algunos avisos con ese tono.
 * Solo se muestra si la paráfrasis está habilitada en el servidor
 * (`BOT_PARAPHRASE_ENABLED`), que la vista previa informa
 * (`paraphraseAvailable`): no ofrecemos algo que el negocio no puede usar.
 *
 * T22: enlaza a "Mensajes del asistente", donde el negocio redacta los
 * mensajes con sus palabras (a mano o con IA).
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, Crown, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "@/i18n/routing";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { UpgradePlanModal } from "@/features/subscription/components/UpgradePlanModal";
import { useBotVoicePreview, useUpdateBusiness } from "../hooks/useBusiness";
import type { BotVoice, Business } from "../types/business.types";

const ASSISTANT_NAME_MAX = 30;
const ASSISTANT_NAME_FORMAT = /^[\p{L}\p{N} .'-]*$/u;

/** Voz por defecto que ven los planes sin acceso (no se persiste). */
function lockedVoice(defaultName: string): BotVoice {
  return {
    address: "tu",
    emojis: true,
    assistantName: defaultName,
    paraphrase: false,
  };
}

/** Planes con acceso a configurar la voz del asistente. */
function canEditVoice(plan: number | undefined): boolean {
  return plan === 3 || plan === 4;
}

function voiceOf(business: Business): BotVoice {
  return {
    address: business.botVoice?.address === "usted" ? "usted" : "tu",
    emojis: business.botVoice?.emojis !== false,
    assistantName: business.botVoice?.assistantName ?? "",
    paraphrase: business.botVoice?.paraphrase === true,
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
  const tm = useTranslations("settings.botMessages.link");
  const updateBusiness = useUpdateBusiness();
  const subscriptionPlan = useAuthStore(
    (state) => state.user?.subscriptionPlan
  );
  // El negocio trae el plan fresco de la BD (`/businesses/me` lo incluye
  // en la respuesta); el JWT es el fallback (ej. SUPER_ADMIN sin negocio).
  const editable = canEditVoice(business.subscriptionPlan ?? subscriptionPlan);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Sin acceso (Basic/Free) se muestra la voz por defecto con el nombre
  // del asistente ToGo; cualquier intento de cambio abre el modal de
  // mejorar el plan. Solo presentación: no se persiste nada y la
  // conversación sigue resolviendo la voz guardada (resolveBotVoice).
  // El estado arranca de la voz guardada; el padre monta la tarjeta con
  // `key={botVoiceKey(business)}`, así que al guardar se reinicia sola.
  const saved = editable
    ? voiceOf(business)
    : lockedVoice(tb("botVoice.locked.defaultName"));
  const [voice, setVoice] = useState<BotVoice>(saved);

  const requirePlan = () => {
    if (!editable) setIsUpgradeOpen(true);
    return editable;
  };

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
    voice.paraphrase !== saved.paraphrase ||
    name.trim() !== (saved.assistantName ?? "");

  // Oculto hasta que la vista previa confirme que el servidor la tiene
  // habilitada. Si estaba prendida y el servidor la apagó, el valor
  // guardado se conserva tal cual al guardar (no tiene efecto igual).
  const paraphraseAvailable = preview.data?.paraphraseAvailable === true;

  const handleSave = async () => {
    if (!requirePlan()) return;
    if (nameError) return;
    try {
      await updateBusiness.mutateAsync({
        businessId: business.id,
        data: {
          botVoice: {
            address: voice.address,
            emojis: voice.emojis,
            assistantName: name.trim(),
            paraphrase: voice.paraphrase === true,
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
          {!editable && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <Crown className="h-3 w-3" />
              {tb("botVoice.locked.badge")}
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          {tb("botVoice.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!editable && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-900">
              {tb("botVoice.locked.description")}
            </p>
            <Button
              type="button"
              size="sm"
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setIsUpgradeOpen(true)}
            >
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              {tb("botVoice.locked.cta")}
            </Button>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>{tb("botVoice.address.label")}</Label>
              <RadioGroup
                value={voice.address}
                onValueChange={(value) => {
                  if (!requirePlan()) return;
                  setVoice((prev) => ({
                    ...prev,
                    address: value === "usted" ? "usted" : "tu",
                  }));
                }}
                className="space-y-2"
                aria-disabled={!editable}
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
                onCheckedChange={(checked) => {
                  if (!requirePlan()) return;
                  setVoice((prev) => ({ ...prev, emojis: checked }));
                }}
                aria-disabled={!editable}
              />
            </div>

            {paraphraseAvailable && (
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="botVoice-paraphrase" className="text-base">
                      {tb("botVoice.paraphrase.label")}
                    </Label>
                    <p className="text-sm text-slate-500">
                      {tb("botVoice.paraphrase.description")}
                    </p>
                  </div>
                  <Switch
                    id="botVoice-paraphrase"
                    checked={voice.paraphrase === true}
                    onCheckedChange={(checked) => {
                      if (!requirePlan()) return;
                      setVoice((prev) => ({ ...prev, paraphrase: checked }));
                    }}
                    aria-disabled={!editable}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="botVoice-name">
                {tb("botVoice.assistantName.label")}
              </Label>
              <Input
                id="botVoice-name"
                value={name}
                maxLength={ASSISTANT_NAME_MAX}
                placeholder={tb("botVoice.assistantName.placeholder")}
                onChange={(e) => {
                  if (!requirePlan()) return;
                  setVoice((prev) => ({
                    ...prev,
                    assistantName: e.target.value,
                  }));
                }}
                onFocus={() => {
                  requirePlan();
                }}
                aria-disabled={!editable}
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

        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
          <div className="space-y-0.5">
            <p className="flex items-center gap-2 text-base font-medium text-slate-900">
              <MessagesSquare className="h-4 w-4 text-indigo-600" />
              {tm("title")}
            </p>
            <p className="text-sm text-slate-500">{tm("description")}</p>
          </div>
          <Link href="/dashboard/settings/general/bot-messages">
            <Button type="button" variant="slate-outline" size="sm">
              {tm("button")}
            </Button>
          </Link>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              !editable || !isDirty || !!nameError || updateBusiness.isPending
            }
            isLoading={updateBusiness.isPending}
          >
            {tc("buttons.save")}
          </Button>
        </div>
      </CardContent>
      <UpgradePlanModal
        open={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </Card>
  );
}
