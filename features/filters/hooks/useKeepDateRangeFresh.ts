"use client";

import { useEffect } from "react";
import { useDateFilterStore } from "../stores/date-filter.store";

// Cada cuánto se revisa si cambió el día con la pestaña visible.
const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Mantiene "Hoy", "Esta semana", etc. al día mientras la pestaña sigue
 * abierta. El rango solo se calculaba al cargar la página: una pestaña
 * abierta desde ayer seguía pidiendo los pedidos de ayer, así que un pedido
 * nuevo sonaba pero no aparecía en el tablero hasta refrescar.
 *
 * Revisa al volver a la pestaña y cada minuto; `recalculateRange` no escribe
 * si el día no cambió.
 */
export function useKeepDateRangeFresh(): void {
  useEffect(() => {
    const refresh = () => useDateFilterStore.getState().recalculateRange();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, []);
}
