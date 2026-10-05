"use client";

/**
 * Un mensaje del asistente (plan bot natural, T22): cuándo se envía, sus
 * versiones como burbujas de WhatsApp (con datos de ejemplo) y las acciones
 * editar, regenerar con IA y volver al template.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/error.utils";
import { cn } from "@/lib/utils";
import type {
  BotMessage,
  BotMessageOrigin,
  BotMessagesCatalog,
} from "../types/bot-messages.types";
import {
  useRegenerateBotMessage,
  useResetBotMessage,
  useSaveBotMessageDraft,
} from "../hooks/useBotMessages";
import {
  RECOMMENDED_VARIANTS,
  shownVersions,
  withSampleValues,
  withWhatsAppBold,
} from "../utils/bot-message.utils";
import { BotMessageEditor } from "./BotMessageEditor";

const ORIGIN_STYLE: Record<BotMessageOrigin, string> = {
  TEMPLATE: "bg-slate-100 text-slate-600",
  MANUAL: "bg-emerald-100 text-emerald-700",
  AI: "bg-indigo-100 text-indigo-700",
  AI_EDITED: "bg-purple-100 text-purple-700",
};

interface BotMessageCardProps {
  businessId: string;
  message: BotMessage;
  voice: BotMessagesCatalog["voice"];
  aiAvailable: boolean;
  /** La última "Editar con IA" no logró completar este mensaje. */
  aiFailed: boolean;
}

export function BotMessageCard({
  businessId,
  message,
  voice,
  aiAvailable,
  aiFailed,
}: BotMessageCardProps) {
  const t = useTranslations("settings.botMessages");
  const [editing, setEditing] = useState(false);
  const save = useSaveBotMessageDraft(businessId);
  const reset = useResetBotMessage(businessId);
  const regenerate = useRegenerateBotMessage(businessId);

  const shown = shownVersions(message);
  const isAi = shown.origin === "AI" || shown.origin === "AI_EDITED";
  const errors = message.issues.filter((i) => i.severity === "error");

  const run = async (action: () => Promise<unknown>, error: string) => {
    try {
      await action();
    } catch (err) {
      toast.error(extractErrorMessage(err, error));
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                ORIGIN_STYLE[shown.origin]
              )}
            >
              {t(`origin.${shown.origin}`)}
            </span>
            {message.draft && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {t("unpublished")}
              </span>
            )}
            <span
              className={
                shown.variants.length < RECOMMENDED_VARIANTS
                  ? "text-xs text-amber-600"
                  : "text-xs text-slate-500"
              }
              title={t("whyVersions.short")}
            >
              {t("versionCount", { count: shown.variants.length })}
            </span>
          </div>
          <p className="text-sm text-slate-700">{message.purpose}</p>
        </div>
        {!editing && (
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Button
              type="button"
              variant="slate-outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t("actions.edit")}
            </Button>
            {aiAvailable && isAi && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={regenerate.isPending}
                isLoading={regenerate.isPending}
                onClick={() =>
                  run(
                    () => regenerate.mutateAsync(message.id),
                    t("errors.regenerate")
                  )
                }
              >
                {!regenerate.isPending && (
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-indigo-600" />
                )}
                {t("actions.regenerate")}
              </Button>
            )}
            {shown.origin !== "TEMPLATE" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={reset.isPending}
                onClick={() =>
                  run(() => reset.mutateAsync(message.id), t("errors.reset"))
                }
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                {t("actions.reset")}
              </Button>
            )}
          </div>
        )}
      </div>

      {aiFailed && shown.origin === "TEMPLATE" && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("aiFailed")}
        </p>
      )}
      {errors.length > 0 && !editing && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("hasErrors")}
        </p>
      )}

      {editing ? (
        <BotMessageEditor
          message={message}
          initial={shown.variants}
          voice={voice}
          isSaving={save.isPending}
          onCancel={() => setEditing(false)}
          onSave={(variants) =>
            run(async () => {
              await save.mutateAsync({ templateId: message.id, variants });
              setEditing(false);
            }, t("errors.save"))
          }
        />
      ) : (
        <div className="space-y-1.5 rounded-lg bg-slate-50 p-3">
          {shown.variants.map((text, i) => (
            <p
              key={i}
              className="max-w-[90%] whitespace-pre-line rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            >
              {withWhatsAppBold(withSampleValues(text))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
