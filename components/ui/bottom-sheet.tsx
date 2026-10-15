"use client";

/**
 * Hoja que sube desde abajo (teléfono): menús de acciones a un toque del
 * pulgar. Usa el mismo vaul que `drawer.tsx`, que solo abre a la derecha.
 */

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nombre accesible de la hoja (no se muestra). */
  title: string;
  /**
   * Al terminar de cerrarse. Para abrir un diálogo desde una opción: si se
   * abre mientras la hoja todavía se cierra, el cierre de vaul y la
   * apertura del diálogo se pisan (foco, pointer-events del body).
   */
  onClosed?: () => void;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  onClosed,
  children,
}: BottomSheetProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      onAnimationEnd={(isOpen) => {
        if (!isOpen) onClosed?.();
      }}
      direction="bottom"
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/45" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[22px] bg-white",
            "px-3 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none"
          )}
        >
          <DrawerPrimitive.Title className="sr-only">{title}</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            {title}
          </DrawerPrimitive.Description>
          <span
            aria-hidden
            className="mx-auto mb-2 h-[5px] w-10 shrink-0 rounded-full bg-slate-300"
          />
          <div role="menu" aria-label={title} className="flex flex-col">
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

interface BottomSheetItemProps {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function BottomSheetItem({
  icon: Icon,
  children,
  onSelect,
  destructive,
  disabled,
}: BottomSheetItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex h-[52px] items-center gap-3 rounded-xl px-2 text-left text-[15px] transition-colors",
        "hover:bg-slate-50 disabled:opacity-50",
        destructive ? "font-semibold text-red-700" : "font-medium text-slate-900"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {children}
    </button>
  );
}
