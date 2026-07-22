"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlanCatalog } from "../services/subscription.service";

/**
 * Catálogo de planes (límites y precios) servido desde el backend.
 * Reemplaza los valores hardcodeados de lib/plan.utils.ts (PLAN_PRICES) —
 * ahora el backend es la única fuente de verdad, configurable por env.
 */
export function usePlanCatalog() {
  return useQuery({
    queryKey: ["plan-catalog"],
    queryFn: getPlanCatalog,
    staleTime: 60 * 60 * 1000, // 1 hora — los planes casi no cambian
  });
}
