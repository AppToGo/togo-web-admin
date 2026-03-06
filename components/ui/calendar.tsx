"use client";

import * as React from "react";
import { DayPicker, DateRange, getDefaultClassNames } from "react-day-picker";
import { es } from "date-fns/locale";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

// Re-exportamos el tipo DateRange
export type { DateRange };

// Tipo del calendario
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Componente Calendar - personalizado con colores de la plataforma
export function Calendar(props: CalendarProps) {
  // Ignoramos className general
  const { className, ...restProps } = props;

  // Obtenemos los classNames por defecto
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      locale={es}
      lang="es"
      showOutsideDays
      className="p-3"
      classNames={{
        // Extendemos los estilos por defecto
        root: cn(defaultClassNames.root, "justify-center flex"),
        day: cn(defaultClassNames.day, "group"),
        selected: cn("text-white"),
        // Permitimos otros overrides si se pasan
        ...props.classNames,
      }}
      components={{
        // Botón de día personalizado con colores indigo
        DayButton: (buttonProps) => {
          const { day, ...rest } = buttonProps;
          return (
            <button
              {...rest}
              className={cn(
                // Estilo base
                "w-9 h-9 m-0.5 rounded-md",
                "text-sm font-normal",
                "transition-colors",
                // Estado normal
                "hover:bg-slate-100",
                // Estado seleccionado (inicio o fin del rango)
                "group-aria-selected:bg-indigo-600",
                "group-aria-selected:text-white",
                "group-aria-selected:hover:bg-indigo-700",
                // Rango medio
                "group-data-[in-range=true]:bg-indigo-400",
                "group-data-[in-range=true]:text-white",
                // Hoy
                "group-data-[today=true]:font-semibold",
                "group-data-[today=true]:text-slate-900",
                // Deshabilitado
                "group-data-[disabled=true]:opacity-50",
                "group-data-[disabled=true]:cursor-not-allowed"
              )}
            />
          );
        },
      }}
      {...restProps}
    />
  );
}
Calendar.displayName = "Calendar";
