"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        nav: "absolute inset-0 top-0 flex w-full items-center justify-between gap-1 rdp-nav",
        months: "relative flex flex-col gap-4 md:flex-row rdp-months",
        month: "flex w-full flex-col gap-4 rdp-month",

        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md",
        day_range_end: "day-range-end",
        // Colores personalizados para selección - usando indigo de la plataforma
        day_selected: "bg-indigo-500 text-white hover:bg-indigo-600",
        day_today: "bg-slate-100 text-slate-900",
        day_outside: "text-slate-400 opacity-50",
        day_disabled: "text-slate-400 opacity-50",
        // Color del rango medio - indigo claro
        day_range_middle: "bg-indigo-100 text-indigo-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
export type { DateRange };
