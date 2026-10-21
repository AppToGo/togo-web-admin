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
