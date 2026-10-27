import type { FeatureKey } from "@/features/business-features/types";
import type { FeatureDefinition } from "../types";

/** Lo que se activa además al activar `keys` (sus `requires`, recursivo). */
export function getIncludedRequirements(
  keys: FeatureKey[],
  registry: FeatureDefinition[]
): FeatureKey[] {
  const byKey = new Map(registry.map((f) => [f.key, f]));
  const result = new Set<FeatureKey>();
  const visit = (key: FeatureKey) => {
    for (const dep of byKey.get(key)?.requires ?? []) {
      if (!result.has(dep)) {
        result.add(dep);
        visit(dep);
      }
    }
  };
  keys.forEach(visit);
  return [...result].filter((k) => !keys.includes(k));
}

/** Funcionalidades que dependen de alguna de `keys` (pueden apagarse en cascada). */
export function getDependents(
  keys: FeatureKey[],
  registry: FeatureDefinition[]
): FeatureKey[] {
  return registry
    .filter(
      (f) =>
        !keys.includes(f.key) &&
        [...(f.requires ?? []), ...(f.requiresAnyOf ?? [])].some((d) =>
          keys.includes(d)
        )
    )
    .map((f) => f.key);
}
