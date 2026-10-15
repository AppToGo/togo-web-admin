"use client";

/**
 * Pantalla completa del teléfono para un detalle (un cliente, un hilo):
 * tapa la barra superior con su propia cabecera (volver + título +
 * acciones), un cuerpo con scroll y un pie fijo opcional. En pantallas
 * grandes no se muestra: ahí el detalle vive en el layout de escritorio.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { HIDDEN_FROM, type HiddenFrom } from "./hidden-from";


interface MobileScreenProps {
  hiddenFrom: HiddenFrom;
  onBack: () => void;
  backLabel: string;
  /** Centro de la cabecera (nombre, estado…). */
  title: React.ReactNode;
  /** Derecha de la cabecera (menú de acciones, badge…). */
  actions?: React.ReactNode;
  /** Bloque bajo la cabecera que no hace scroll (datos, pestañas, avisos). */
  subheader?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Clases del cuerpo con scroll. */
  bodyClassName?: string;
  /** Sin línea bajo la cabecera: el `subheader` sigue en el mismo bloque blanco. */
  seamlessHeader?: boolean;
  testId?: string;
}

export function MobileScreen({
  hiddenFrom,
  onBack,
  backLabel,
  title,
  actions,
  subheader,
  footer,
  children,
  bodyClassName,
  seamlessHeader,
  testId,
}: MobileScreenProps) {
  const tc = useTranslations("common");

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex flex-col bg-slate-50",
        HIDDEN_FROM[hiddenFrom]
      )}
      data-testid={testId}
    >
      <header
        className={cn(
          "flex shrink-0 items-center gap-1.5 bg-white py-2.5 pl-1.5 pr-3 pt-[max(0.625rem,env(safe-area-inset-top))]",
          !seamlessHeader && "border-b border-slate-200/70"
        )}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel || tc("buttons.back")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-slate-900 hover:bg-slate-100"
        >
          <ChevronLeft className="h-[22px] w-[22px]" />
        </button>
        <div className="min-w-0 flex-1">{title}</div>
        {actions}
      </header>
      {subheader}
      <main
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}
      >
        {children}
      </main>
      {footer && (
        <footer className="shrink-0 border-t border-slate-200/70 bg-white pb-[env(safe-area-inset-bottom)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
