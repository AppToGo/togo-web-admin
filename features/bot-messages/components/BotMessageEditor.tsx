"use client";

/**
 * Editor de las versiones de un mensaje del asistente (plan bot natural,
 * T22): una caja por versión, variables como fichas que se insertan con un
 * clic y validación mientras se escribe.
 */

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  BotMessage,
  BotMessageIssue,
  BotMessagesCatalog,
} from "../types/bot-messages.types";
import {
  MAX_VARIANTS,
  RECOMMENDED_VARIANTS,
  hasErrors,
  validateVariants,
} from "../utils/bot-message.utils";

interface BotMessageEditorProps {
  message: BotMessage;
  initial: string[];
  voice: BotMessagesCatalog["voice"];
  isSaving: boolean;
  onSave: (variants: string[]) => void;
  onCancel: () => void;
}

export function BotMessageEditor({
  message,
  initial,
  voice,
  isSaving,
  onSave,
  onCancel,
}: BotMessageEditorProps) {
  const t = useTranslations("settings.botMessages");
  const tc = useTranslations("common");
  const [variants, setVariants] = useState<string[]>(
    initial.length > 0 ? initial : [""]
  );
  const [focused, setFocused] = useState(0);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const issues = validateVariants(variants, message, voice);
  const issuesOf = (index: number) => issues.filter((i) => i.index === index);
  const filled = variants.filter((v) => v.trim()).length;

  const update = (index: number, value: string) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? value : v)));

  const insertVariable = (name: string) => {
    const index = Math.min(focused, variants.length - 1);
    const area = refs.current[index];
    const token = `{${name}}`;
    const current = variants[index];
    const start = area?.selectionStart ?? current.length;
    const end = area?.selectionEnd ?? current.length;
    update(index, current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const issueText = (issue: BotMessageIssue) =>
    t(`issues.${issue.code}`, {
      variable: issue.variable ? `{${issue.variable}}` : "",
      max: message.maxLength,
    });

  return (
    <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          {t("editor.variables")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {message.allowed.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => insertVariable(name)}
              className={
                message.required.includes(name)
                  ? "rounded-full border border-indigo-300 bg-indigo-100 px-2.5 py-0.5 font-mono text-xs text-indigo-800 hover:bg-indigo-200"
                  : "rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-xs text-slate-600 hover:bg-slate-100"
              }
              title={
                message.required.includes(name)
                  ? t("editor.requiredVariable")
                  : t("editor.optionalVariable")
              }
            >
              {`{${name}}`}
            </button>
          ))}
        </div>
        {message.required.length > 0 && (
          <p className="text-xs text-slate-500">
            {t("editor.requiredHint", {
              variables: message.required.map((v) => `{${v}}`).join(", "),
            })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {variants.map((value, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-right text-xs text-slate-400">
                {index + 1}
              </span>
              <Textarea
                ref={(el) => {
                  refs.current[index] = el;
                }}
                value={value}
                rows={Math.min(6, Math.max(2, value.split("\n").length))}
                onFocus={() => setFocused(index)}
                onChange={(e) => update(index, e.target.value)}
                placeholder={t("editor.placeholder")}
                className="bg-white text-sm"
                aria-invalid={hasErrors(issuesOf(index))}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-400 hover:text-red-600"
                disabled={variants.length === 1}
                onClick={() =>
                  setVariants((prev) => prev.filter((_, i) => i !== index))
                }
                aria-label={t("editor.removeVersion")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="ml-7 flex flex-wrap justify-between gap-x-3 text-xs">
              <div className="space-y-0.5">
                {issuesOf(index).map((issue, i) => (
                  <p
                    key={i}
                    className={
                      issue.severity === "error"
                        ? "text-red-500"
                        : "text-amber-600"
                    }
                  >
                    {issueText(issue)}
                  </p>
                ))}
              </div>
              <span
                className={
                  value.trim().length > message.maxLength
                    ? "text-red-500"
                    : "text-slate-400"
                }
              >
                {value.trim().length}/{message.maxLength}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="slate-outline"
            size="sm"
            disabled={variants.length >= MAX_VARIANTS}
            onClick={() => {
              setVariants((prev) => [...prev, ""]);
              setFocused(variants.length);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("editor.addVersion")}
          </Button>
          {filled < RECOMMENDED_VARIANTS && (
            <p className="text-xs text-amber-600">
              {t("editor.fewVersions", { min: RECOMMENDED_VARIANTS })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {tc("buttons.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={hasErrors(issues) || isSaving}
            isLoading={isSaving}
            onClick={() => onSave(variants.map((v) => v.trim()))}
          >
            {t("editor.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
