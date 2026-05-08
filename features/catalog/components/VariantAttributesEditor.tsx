"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttributeSchema } from "../types/catalog.types";

interface VariantAttributesEditorProps {
  schema: AttributeSchema | undefined;
  value: Record<string, string | number>;
  onChange: (val: Record<string, string | number>) => void;
  readOnly?: boolean;
}

function coerceValue(raw: string): string | number {
  if (raw === "") return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

export function VariantAttributesEditor({
  schema,
  value,
  onChange,
  readOnly = false,
}: VariantAttributesEditorProps) {
  // ── Schema-driven mode ──────────────────────────────────────────────────────
  if (schema && schema.keys.length > 0) {
    const handleSchemaChange = (key: string, raw: string) => {
      onChange({ ...value, [key]: coerceValue(raw) });
    };

    // Custom keys (allowCustomKeys = true) — rows not in schema.keys
    const customRows = Object.entries(value).filter(
      ([k]) => !schema.keys.includes(k)
    );

    const handleAddCustom = () => {
      const newKey = `atributo_${Date.now()}`;
      onChange({ ...value, [newKey]: "" });
    };

    const handleCustomKeyChange = (oldKey: string, newKey: string) => {
      const next: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(value)) {
        next[k === oldKey ? newKey : k] = v;
      }
      onChange(next);
    };

    const handleCustomValueChange = (key: string, raw: string) => {
      onChange({ ...value, [key]: coerceValue(raw) });
    };

    const handleRemoveCustom = (key: string) => {
      const next = { ...value };
      delete next[key];
      onChange(next);
    };

    return (
      <div className="space-y-3">
        {schema.keys.map((key) => {
          const isRequired = schema.required.includes(key);
          const hints = schema.valueHints?.[key];
          const currentVal = value[key] ?? "";

          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`attr-${key}`} className="text-sm">
                {key}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {hints && hints.length > 0 ? (
                <Select
                  value={String(currentVal)}
                  onValueChange={(v) => handleSchemaChange(key, v)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`attr-${key}`}>
                    <SelectValue placeholder={`Seleccionar ${key}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {hints.map((hint) => (
                      <SelectItem key={hint} value={hint}>
                        {hint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`attr-${key}`}
                  value={String(currentVal)}
                  onChange={(e) => handleSchemaChange(key, e.target.value)}
                  disabled={readOnly}
                  placeholder={`Valor para ${key}`}
                />
              )}
            </div>
          );
        })}

        {customRows.map(([key, val]) => (
          <div key={key} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm">Clave</Label>
              <Input
                value={key}
                onChange={(e) => handleCustomKeyChange(key, e.target.value)}
                disabled={readOnly}
                placeholder="nombre"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm">Valor</Label>
              <Input
                value={String(val)}
                onChange={(e) => handleCustomValueChange(key, e.target.value)}
                disabled={readOnly}
                placeholder="valor"
              />
            </div>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveCustom(key)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}

        {!readOnly && schema.allowCustomKeys && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustom}
            className="mt-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar atributo
          </Button>
        )}
      </div>
    );
  }

  // ── Free-form mode (no schema) ──────────────────────────────────────────────
  const rows = Object.entries(value);

  const handleAdd = () => {
    const newKey = `atributo_${Date.now()}`;
    onChange({ ...value, [newKey]: "" });
  };

  const handleKeyChange = (oldKey: string, newKey: string) => {
    const next: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(value)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };

  const handleValueChange = (key: string, raw: string) => {
    onChange({ ...value, [key]: coerceValue(raw) });
  };

  const handleRemove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {rows.map(([key, val]) => (
        <div key={key} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm">Clave</Label>
            <Input
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
              disabled={readOnly}
              placeholder="nombre"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm">Valor</Label>
            <Input
              value={String(val)}
              onChange={(e) => handleValueChange(key, e.target.value)}
              disabled={readOnly}
              placeholder="valor"
            />
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemove(key)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ))}

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="mt-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar atributo
        </Button>
      )}
    </div>
  );
}
