"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ImportItem, UpdateImportItemDto } from "../types/import.types";

interface EditImportItemDrawerProps {
  item: ImportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, dto: UpdateImportItemDto) => void;
  isSaving: boolean;
}

export function EditImportItemDrawer({
  item,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: EditImportItemDrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setPrice(item.price !== null ? String(item.price) : "");
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const dto: UpdateImportItemDto = {};
    if (name.trim() !== item.name) dto.name = name.trim();
    if ((description || null) !== item.description) dto.description = description || undefined;
    const parsedPrice = price ? parseFloat(price) : undefined;
    if (parsedPrice !== (item.price ?? undefined)) dto.price = parsedPrice;
    onSave(item.id, dto);
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSaving && !open) onClose();
      }}
      isLoading={isSaving}
    >
      <DrawerContent size="md">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DrawerHeader>
            <DrawerTitle>Editar producto</DrawerTitle>
            <DrawerDescription>
              Modificá los datos detectados antes de importar
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Nombre</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-description">Descripción</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-price">Precio</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSaving}
                placeholder="0.00"
              />
            </div>
          </div>

          <DrawerFooter className="border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={isSaving}>
              Guardar
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
