"use client";
/**
 * Fechas y horas de caja en la zona horaria de la SEDE, no la del navegador
 * (docs/caja-pedidos.md): un dueño que revisa desde otro huso debe ver las
 * mismas horas que el cajero para cuadrar contra el cierre del turno.
 */
import { createContext, useContext, useMemo } from "react";
import { useLocale } from "next-intl";

const CashTimeZoneContext = createContext<string | undefined>(undefined);

export function CashTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <CashTimeZoneContext.Provider value={timeZone}>
      {children}
    </CashTimeZoneContext.Provider>
  );
}

type DateInput = string | Date;

export function useCashDateFormat() {
  const locale = useLocale();
  // Sin proveedor (o mientras carga la sede) cae a la zona del navegador.
  const timeZone = useContext(CashTimeZoneContext);

  return useMemo(() => {
    const make = (options: Intl.DateTimeFormatOptions) => {
      const formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone });
      return (value: DateInput) => formatter.format(new Date(value));
    };
    return {
      time: make({ hour: "numeric", minute: "2-digit" }),
      date: make({ day: "numeric", month: "short", year: "numeric" }),
      dateTime: make({
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  }, [locale, timeZone]);
}
