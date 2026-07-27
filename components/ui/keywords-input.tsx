"use client";

import * as React from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { KeywordEntry } from "@/features/catalog/types";
import { EDITABLE_KEYWORD_SOURCES } from "@/features/catalog/types";

export interface KeywordsInputProps {
  value: KeywordEntry[];
  onChange: (entries: KeywordEntry[]) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  inheritedTooltip?: (entry: KeywordEntry) => string;
  disabled?: boolean;
  max?: number;
  onRegenerateAi?: () => void;
  isRegenerating?: boolean;
  regenerateLabel?: string;
  className?: string;
}

/**
 * Chip input para `searchKeywords`. Las entradas heredadas (categoría,
 * subcategoría, nombre) se muestran atenuadas y no se pueden borrar acá — se
 * recalculan solas en el backend cuando cambia la categoría o el nombre. Solo
 * las entradas 'manual'/'ai' son editables: se pueden agregar a mano o quitar.
 */
export function KeywordsInput({
  value,
  onChange,
  label,
  helperText,
  placeholder,
  inheritedTooltip,
  disabled,
  max = 20,
  onRegenerateAi,
  isRegenerating,
  regenerateLabel,
  className,
}: KeywordsInputProps) {
  const [draft, setDraft] = React.useState("");
  const isEditable = (entry: KeywordEntry) =>
    EDITABLE_KEYWORD_SOURCES.includes(entry.source);
  const inherited = value.filter((e) => !isEditable(e));
  const editable = value.filter((e) => isEditable(e));
  const atCapacity = value.length >= max;

  const commitDraft = () => {
    const raw = draft.trim();
    setDraft("");
    if (!raw || atCapacity) return;
    const normalized = raw.toLowerCase();
    const alreadyExists = value.some((e) => e.value.toLowerCase() === normalized);
    if (alreadyExists) return;
    onChange([...value, { value: raw, source: "manual" }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft.length === 0 && editable.length > 0) {
      // Backspace on an empty input removes the last editable chip — mirrors
      // the common "tag input" affordance without needing a mouse.
      const last = editable[editable.length - 1];
      onChange(value.filter((e) => e !== last));
    }
  };

  const removeEntry = (entry: KeywordEntry) => {
    onChange(value.filter((e) => e !== entry));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || onRegenerateAi) && (
        <div className="flex items-center justify-between">
          {label && <Label>{label}</Label>}
          {onRegenerateAi && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-primary"
              onClick={onRegenerateAi}
              disabled={disabled || isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {regenerateLabel}
            </Button>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {inherited.map((entry, i) => (
          <span
            key={`inherited-${entry.source}-${entry.value}-${i}`}
            title={inheritedTooltip?.(entry)}
            className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
          >
            {entry.value}
          </span>
        ))}
        {editable.map((entry, i) => (
          <span
            key={`editable-${entry.source}-${entry.value}-${i}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              entry.source === "ai"
                ? "bg-indigo-50 text-indigo-700"
                : "bg-primary/10 text-primary",
            )}
          >
            {entry.value}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEntry(entry)}
                className="rounded-full hover:bg-black/10"
                aria-label={`Quitar "${entry.value}"`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && !atCapacity && (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitDraft}
            placeholder={value.length === 0 ? placeholder : undefined}
            className="min-w-[8ch] flex-1 border-0 bg-transparent p-0.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        <p className="ml-auto text-xs text-slate-400">
          {value.length}/{max}
        </p>
      </div>
    </div>
  );
}
