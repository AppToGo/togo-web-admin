"use client";

/**
 * Botón flotante de crear (teléfono, < md): abajo a la derecha, encima de
 * la barra inferior de la sección si la hay.
 */

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFabProps {
  label: string;
  onClick: () => void;
  /** Hay barra inferior debajo: sube el botón para no taparla. */
  aboveBottomNav?: boolean;
  testId?: string;
}

export function MobileFab({ label, onClick, aboveBottomNav, testId }: MobileFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "fixed right-4 z-30 flex h-[52px] items-center gap-2 rounded-full bg-slate-900 pl-4 pr-5 text-[15px] font-semibold text-white shadow-lg md:hidden",
        aboveBottomNav ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]" : "bottom-6"
      )}
    >
      <Plus className="h-5 w-5" />
      {label}
    </button>
  );
}
