"use client";

import type { LucideIcon } from "lucide-react";
import { CardHeader } from "@/components/ui/card";

interface DashboardCardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Contenido alineado a la derecha del título (p. ej. una comparativa). */
  children?: React.ReactNode;
}

/** Encabezado de las tarjetas glass del dashboard: ícono índigo + título + subtítulo. */
export function DashboardCardHeader({
  icon: Icon,
  title,
  subtitle,
  children,
}: DashboardCardHeaderProps) {
  return (
    <CardHeader className="pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* h2: las secciones del dashboard no tienen otro encabezado */}
          <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
            <Icon className="h-5 w-5 text-indigo-600" />
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </CardHeader>
  );
}
