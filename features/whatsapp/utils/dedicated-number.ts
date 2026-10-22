import type { WhatsAppAccount, WhatsAppRouting } from "../types";

/**
 * Sedes con número exclusivo: una cuenta COEXISTENCE cuyos routings
 * DIRECT_TO_BRANCH activos van a UNA sola sede. Es la misma regla que usa
 * la API (`BotAttentionService.resolveScope`): cambiarla en un lado exige
 * cambiarla en el otro.
 */
export function dedicatedBranchIds(
  routings: WhatsAppRouting[] | undefined,
  accounts: WhatsAppAccount[] | undefined
): Set<string> {
  const coexistence = new Set(
    (accounts ?? [])
      .filter((a) => a.connectionType === "COEXISTENCE")
      .map((a) => a.id)
  );
  const branchesByAccount = new Map<string, Set<string>>();
  for (const r of routings ?? []) {
    if (
      !r.isActive ||
      r.strategy !== "DIRECT_TO_BRANCH" ||
      !r.branchId ||
      !coexistence.has(r.whatsappAccountId)
    ) {
      continue;
    }
    const set = branchesByAccount.get(r.whatsappAccountId) ?? new Set();
    set.add(r.branchId);
    branchesByAccount.set(r.whatsappAccountId, set);
  }
  const result = new Set<string>();
  for (const branches of branchesByAccount.values()) {
    if (branches.size === 1) result.add([...branches][0]);
  }
  return result;
}

/**
 * Sedes con número propio, sin importar cómo está conectado: routing
 * DIRECT_TO_BRANCH activo. Solo sirve para explicar en el admin por qué una
 * sede con número "solo API" no tiene atención propia (necesita
 * coexistencia, ver `dedicatedBranchIds`).
 */
export function branchesWithOwnNumber(
  routings: WhatsAppRouting[] | undefined
): Set<string> {
  return new Set(
    (routings ?? [])
      .filter(
        (r) => r.isActive && r.strategy === "DIRECT_TO_BRANCH" && r.branchId
      )
      .map((r) => r.branchId as string)
  );
}
