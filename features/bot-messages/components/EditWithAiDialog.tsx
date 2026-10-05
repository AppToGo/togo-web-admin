"use client";

/**
 * "Editar con IA" (plan bot natural, T22). Opcional: el negocio escribe
 * cómo diría 3 mensajes y la IA llena todos los demás con ese estilo, con 3
 * o más versiones cada uno. Todo queda en borrador para revisar y retocar
 * antes de publicar.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractErrorMessage } from "@/lib/error.utils";
import type {
  BotMessage,
  BotMessagesCatalog,
} from "../types/bot-messages.types";
import {
  BOT_MESSAGES_KEYS,
  useBotMessagesRun,
  useGenerateBotMessages,
} from "../hooks/useBotMessages";
import {
  hasErrors,
  shownVersions,
  validateVariants,
  withSampleValues,
  withWhatsAppBold,
} from "../utils/bot-message.utils";

/** Mensajes sugeridos como ejemplo: los que más dicen de cómo habla un negocio. */
const SUGGESTED_EXAMPLES = [
  "GREETING:default",
  "ADD_TO_CART:added",
  "CONFIRM_ORDER:confirmed",
];
const STYLE_NOTES_MAX = 500;

const isOwn = (message: BotMessage) => {
  const origin = shownVersions(message).origin;
  return origin === "MANUAL" || origin === "AI_EDITED";
};

interface EditWithAiDialogProps {
  businessId: string;
  catalog: BotMessagesCatalog;
  open: boolean;
  onClose: () => void;
}

export function EditWithAiDialog({
  businessId,
  catalog,
  open,
  onClose,
}: EditWithAiDialogProps) {
  const t = useTranslations("settings.botMessages.ai");
  const tm = useTranslations("settings.botMessages");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();

  const messages = useMemo(
    () => catalog.stages.flatMap((stage) => stage.messages),
    [catalog]
  );
  const byId = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages]
  );

  const initialExamples = () =>
    SUGGESTED_EXAMPLES.filter((id) => byId.has(id)).map((id) => {
      const message = byId.get(id)!;
      return {
        templateId: id,
        text: isOwn(message) ? shownVersions(message).variants[0] : "",
      };
    });

  const [examples, setExamples] = useState(initialExamples);
  const [styleNotes, setStyleNotes] = useState(catalog.voice.styleNotes ?? "");
  const [keepManual, setKeepManual] = useState(true);
  const [runId, setRunId] = useState<string | null>(null);

  const generate = useGenerateBotMessages(businessId);
  const run = useBotMessagesRun(businessId, runId);
  const finished = run.data?.status === "DONE" || run.data?.status === "FAILED";

  useEffect(() => {
    if (finished) {
      queryClient.invalidateQueries({
        queryKey: BOT_MESSAGES_KEYS.catalog(businessId),
      });
    }
  }, [finished, businessId, queryClient]);

  const exampleIds = examples.map((e) => e.templateId);
  const ownOthers = messages.filter(
    (m) => isOwn(m) && !exampleIds.includes(m.id)
  ).length;
  const exampleIssues = examples.map((example) => {
    const message = byId.get(example.templateId);
    return message
      ? validateVariants([example.text], message, catalog.voice)
      : [];
  });
  const canSubmit =
    new Set(exampleIds).size === 3 &&
    examples.every((e) => e.text.trim()) &&
    !exampleIssues.some(hasErrors) &&
    catalog.generationsLeftToday > 0;

  const handleClose = () => {
    if (runId && !finished) return; // mientras genera, el diálogo se queda
    setRunId(null);
    setExamples(initialExamples());
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const created = await generate.mutateAsync({
        examples: examples.map((e) => ({ ...e, text: e.text.trim() })),
        styleNotes: styleNotes.trim(),
        keepManual,
      });
      setRunId(created.id);
    } catch (err) {
      toast.error(extractErrorMessage(err, t("errors.start")));
    }
  };

  const progress = run.data
    ? Math.round((run.data.done / Math.max(1, run.data.total)) * 100)
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      className="max-w-2xl"
    >
      <DialogContent className="overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {runId ? (
          <div className="space-y-4 px-6 py-4">
            {finished ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="font-medium text-slate-900">
                  {run.data?.status === "FAILED"
                    ? t("progress.failed")
                    : t("progress.done", {
                        count:
                          (run.data?.total ?? 0) -
                          (run.data?.failedIds.length ?? 0),
                      })}
                </p>
                {(run.data?.failedIds.length ?? 0) > 0 && (
                  <p className="text-sm text-amber-600">
                    {t("progress.someFailed", {
                      count: run.data?.failedIds.length ?? 0,
                    })}
                  </p>
                )}
                <p className="text-sm text-slate-500">{t("progress.review")}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                </div>
                <p className="font-medium text-slate-900">
                  {t("progress.writing")}
                </p>
                <Progress value={progress} className="max-w-sm" />
                <p className="text-sm text-slate-500">
                  {t("progress.count", {
                    done: run.data?.done ?? 0,
                    total: run.data?.total ?? 0,
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 px-6 py-4">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              {t("howItWorks")}
            </div>

            {examples.map((example, index) => {
              const message = byId.get(example.templateId);
              const issues = exampleIssues[index];
              return (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-slate-200 p-3"
                >
                  <Label>{t("exampleLabel", { n: index + 1 })}</Label>
                  <Select
                    value={example.templateId}
                    onValueChange={(templateId) => {
                      const chosen = byId.get(templateId);
                      setExamples((prev) =>
                        prev.map((e, i) =>
                          i === index
                            ? {
                                templateId,
                                text:
                                  chosen && isOwn(chosen)
                                    ? shownVersions(chosen).variants[0]
                                    : "",
                              }
                            : e
                        )
                      );
                    }}
                  >
                    <SelectTrigger className="bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {messages.map((m) => (
                        <SelectItem
                          key={m.id}
                          value={m.id}
                          disabled={
                            m.id !== example.templateId &&
                            exampleIds.includes(m.id)
                          }
                        >
                          {tm(`stages.${m.stage}`)} · {m.purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {message && (
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>{t("todaySays")}</p>
                      <p className="whitespace-pre-line rounded-md bg-slate-50 px-2 py-1.5 text-slate-600">
                        {withWhatsAppBold(
                          withSampleValues(message.templateVariants[0] ?? "")
                        )}
                      </p>
                    </div>
                  )}
                  <Textarea
                    value={example.text}
                    rows={3}
                    placeholder={t("examplePlaceholder")}
                    onChange={(e) =>
                      setExamples((prev) =>
                        prev.map((ex, i) =>
                          i === index ? { ...ex, text: e.target.value } : ex
                        )
                      )
                    }
                    className="text-sm"
                  />
                  {message && message.required.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {tm("editor.requiredHint", {
                        variables: message.required
                          .map((v) => `{${v}}`)
                          .join(", "),
                      })}
                    </p>
                  )}
                  {example.text.trim() &&
                    issues
                      .filter((i) => i.severity === "error")
                      .map((issue, i) => (
                        <p key={i} className="text-xs text-red-500">
                          {tm(`issues.${issue.code}`, {
                            variable: issue.variable
                              ? `{${issue.variable}}`
                              : "",
                            max: message?.maxLength ?? 0,
                          })}
                        </p>
                      ))}
                </div>
              );
            })}

            <div className="space-y-2">
              <Label htmlFor="bot-messages-style-notes">
                {t("styleNotes.label")}
              </Label>
              <Textarea
                id="bot-messages-style-notes"
                value={styleNotes}
                maxLength={STYLE_NOTES_MAX}
                rows={2}
                placeholder={t("styleNotes.placeholder")}
                onChange={(e) => setStyleNotes(e.target.value)}
                className="text-sm"
              />
            </div>

            {ownOthers > 0 && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="bot-messages-keep-manual"
                  checked={keepManual}
                  onCheckedChange={(checked) => setKeepManual(checked === true)}
                />
                <Label
                  htmlFor="bot-messages-keep-manual"
                  className="text-sm font-normal leading-snug"
                >
                  {t("keepManual", { count: ownOthers })}
                </Label>
              </div>
            )}

            <p className="text-xs text-slate-500">
              {t("limit", { count: catalog.generationsLeftToday })}
            </p>
          </div>
        )}

        <DialogFooter>
          {runId ? (
            <Button type="button" disabled={!finished} onClick={handleClose}>
              {t("progress.close")}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                {tc("buttons.cancel")}
              </Button>
              <Button
                type="button"
                disabled={!canSubmit || generate.isPending}
                isLoading={generate.isPending}
                onClick={handleSubmit}
              >
                {!generate.isPending && <Sparkles className="mr-1.5 h-4 w-4" />}
                {t("submit")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
