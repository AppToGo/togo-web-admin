"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { VariantAttributesEditor } from "./VariantAttributesEditor";
import type {
  ProductVariant,
  AttributeSchema,
  CreateVariantDto,
  UpdateVariantDto,
} from "../types/catalog.types";

interface VariantFormProps {
  variant?: ProductVariant;
  schema?: AttributeSchema;
  onSubmit: (dto: CreateVariantDto | UpdateVariantDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VariantForm({
  variant,
  schema,
  onSubmit,
  onCancel,
  isLoading = false,
}: VariantFormProps) {
  const isEditing = !!variant;

  const [variantLabel, setVariantLabel] = useState(variant?.variantLabel ?? "");
  const [price, setPrice] = useState(variant?.price?.toString() ?? "");
  const [internalSku, setInternalSku] = useState(variant?.internalSku ?? "");
  const [barcode, setBarcode] = useState(variant?.barcode ?? "");
  const [isDefault, setIsDefault] = useState(variant?.isDefault ?? false);
  const [isActive, setIsActive] = useState(variant?.isActive ?? true);
  const [attributes, setAttributes] = useState<Record<string, string | number>>(
    variant?.attributes ?? {}
  );

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d*$/.test(v)) {
      setPrice(v);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dto: CreateVariantDto | UpdateVariantDto = {
      variantLabel,
      price: parseFloat(price),
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      internalSku: internalSku || undefined,
      barcode: barcode || undefined,
      isDefault,
      isActive,
    };

    onSubmit(dto);
  };

  const isValid = variantLabel.trim() !== "" && price !== "" && parseFloat(price) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      {/* Variant Label */}
      <div className="space-y-2">
        <Label htmlFor="variantLabel">
          Etiqueta de variante <span className="text-red-500">*</span>
        </Label>
        <Input
          id="variantLabel"
          value={variantLabel}
          onChange={(e) => setVariantLabel(e.target.value)}
          placeholder="Ej: 500ml Rojo, Talla M, ..."
          required
          disabled={isLoading}
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="variantPrice">
          Precio <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <Input
            id="variantPrice"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={handlePriceChange}
            placeholder="0"
            required
            disabled={isLoading}
            className="pl-6"
          />
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-2">
        <Label>Atributos</Label>
        <VariantAttributesEditor
          schema={schema}
          value={attributes}
          onChange={setAttributes}
          readOnly={isLoading}
        />
      </div>

      {/* Internal SKU */}
      <div className="space-y-2">
        <Label htmlFor="internalSku">SKU interno (opcional)</Label>
        <Input
          id="internalSku"
          value={internalSku}
          onChange={(e) => setInternalSku(e.target.value)}
          placeholder="SKU-001"
          disabled={isLoading}
        />
      </div>

      {/* Barcode */}
      <div className="space-y-2">
        <Label htmlFor="barcode">Código de barras (opcional)</Label>
        <Input
          id="barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="7XXXXXXXXXX"
          disabled={isLoading}
        />
      </div>

      {/* Flags */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="isDefault" className="cursor-pointer font-normal">
            Variante por defecto
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="isActive" className="cursor-pointer font-normal">
            Activa
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !isValid} isLoading={isLoading}>
          {isEditing ? "Guardar cambios" : "Crear variante"}
        </Button>
      </div>
    </form>
  );
}
