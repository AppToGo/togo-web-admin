import type { FeaturedErrorBody } from "../types/catalog.types";

/** Código y sedes llenas del 400 del PUT de destacados. */
export function featuredError(err: unknown): FeaturedErrorBody {
  const data = (
    err as { response?: { data?: FeaturedErrorBody } } | null
  )?.response?.data;
  return { code: data?.code, branchIds: data?.branchIds };
}

/**
 * Mensaje (clave de `catalog.featured` y sus valores) para un error al
 * guardar destacados. Lo usan el drawer y el quitado rápido con la estrella.
 */
export function featuredErrorMessage(
  err: unknown,
  limit: number
): { key: string; values?: Record<string, number> } {
  const { code, branchIds } = featuredError(err);
  switch (code) {
    case "FEATURED_IMAGE_REQUIRED":
      return { key: "errors.imageRequired" };
    case "FEATURED_LIMIT_REACHED":
      return {
        key: "errors.limitReached",
        values: { max: limit, count: branchIds?.length ?? 1 },
      };
    case "INVALID_BRANCH":
      return { key: "errors.invalidBranch" };
    default:
      return { key: "errors.generic" };
  }
}
