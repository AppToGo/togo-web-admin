"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

/** Marca de las entradas de historial que agrega este hook. */
const OWNED_KEY = "togoUrlParam";

function urlWith(key: string, value: string | null): string {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Estado que vive en un parámetro de la URL (`?session=…`), para pantallas
 * que se abren encima de otra — el hilo del Inbox en el teléfono. Con
 * `push`, abrir agrega una entrada al historial: el atrás del sistema (o el
 * gesto) la cierra en vez de salir de la página. Sin `push` reemplaza la
 * entrada (escritorio: elegir conversaciones no llena el historial).
 *
 * Usa `window.history` directamente: Next sincroniza `pushState` /
 * `replaceState` con `useSearchParams`, pero solo si el estado NO es uno
 * suyo — por eso nunca se reenvía `window.history.state` (trae sus marcas
 * internas y Next ignora el cambio de URL).
 */
export function useUrlParamState(key: string) {
  const searchParams = useSearchParams();
  const value = searchParams.get(key);

  const open = useCallback(
    (next: string, { push }: { push: boolean }) => {
      if (push) {
        window.history.pushState({ [OWNED_KEY]: key }, "", urlWith(key, next));
      } else {
        window.history.replaceState(null, "", urlWith(key, next));
      }
    },
    [key]
  );

  const close = useCallback(() => {
    // Abierta por este hook: volver atrás (deja el historial como estaba).
    // Llegada por un enlace directo: quitar el parámetro, sin salir de la
    // página ni dejar la URL reabriéndola al recargar.
    if (window.history.state?.[OWNED_KEY] === key) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", urlWith(key, null));
    }
  }, [key]);

  return [value, open, close] as const;
}
