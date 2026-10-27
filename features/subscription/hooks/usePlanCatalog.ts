"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlanCatalog } from "../services/subscription.service";

/**
 * Catálogo de planes (límites y precios) servido desde el backend.
 * Reemplaza los valores hardcodeados de lib/plan.utils.ts (PLAN_PRICES) —
 * ahora el backend es la única fuente de verdad, configurable por env.
 *
 * @param enabled - si es false, no dispara el fetch (ej: el modal de upgrade
 * pasa `open` para no pedir el catálogo en cada carga del dashboard, solo
 * cuando el usuario realmente abre el modal). React Query comparte el cache
 * entre todos los consumidores vía el mismo queryKey.
 */
export function usePlanCatalog(enabled: boolean = true) {
  return useQuery({
    queryKey: ["plan-catalog"],
    queryFn: getPlanCatalog,
    staleTime: 60 * 60 * 1000, // 1 hora — los planes casi no cambian
    enabled,
  });
}

/**
 * Días de prueba gratis configurados en el sistema (`TRIAL_DAYS` del .env de
 * `api-togo`, vía el catálogo). `null` mientras carga: el frontend no tiene
 * un número propio (docs/cobro-suscripciones.md §1), así que quien lo
 * muestra espera el dato en vez de mostrar uno inventado.
 */
export function useTrialDays(enabled: boolean = true): number | null {
  const { data: catalog } = usePlanCatalog(enabled);
  return catalog?.trialDays ?? null;
}
