import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { FeatureDefinition } from "../types";

/**
 * Nombre y descripción traducidos de una funcionalidad. Si una funcionalidad
 * nueva aún no tiene traducción, se usa el texto que envía el backend.
 */
export function useFeatureLabels() {
  const t = useTranslations("admin-feature-flags");

  return useCallback(
    (feature: Pick<FeatureDefinition, "key" | "name" | "description">) => {
      const nameKey = `catalog.${feature.key}.name`;
      const descriptionKey = `catalog.${feature.key}.description`;
      return {
        name: t.has(nameKey) ? t(nameKey) : feature.name,
        description: t.has(descriptionKey) ? t(descriptionKey) : feature.description,
      };
    },
    [t]
  );
}
