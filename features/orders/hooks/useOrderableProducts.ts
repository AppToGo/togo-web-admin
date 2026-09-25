/**
 * Productos que se pueden pedir en una sede (drawer "Nuevo pedido").
 *
 * Usa el inventario de la sede (activado + disponible) en vez del catálogo:
 * trae la variante, el precio efectivo de la sede (priceOverride ?? precio
 * base) y la categoría — exactamente lo que valida el backend al crear.
 * Se cargan todas las páginas de una vez para que el buscador y el filtro
 * por categoría respondan al instante en el cliente.
 */

import { useQuery } from "@tanstack/react-query";
import { getBranchInventory } from "@/features/branch-inventory/services/branch-inventory.service";
import { BRANCH_INVENTORY_KEYS } from "@/features/branch-inventory/hooks/query-keys";
import type { InventoryItem } from "@/features/branch-inventory/types";

/** Máximo que acepta el endpoint por página. */
const PAGE_SIZE = 100;
/** Tope de seguridad: 1.000 productos disponibles por sede. */
const MAX_PAGES = 10;

async function getAllOrderableProducts(
  businessId: string,
  branchId: string
): Promise<InventoryItem[]> {
  const items: InventoryItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await getBranchInventory(businessId, branchId, {
      isActivated: true,
      isAvailable: true,
      page,
      limit: PAGE_SIZE,
    });
    items.push(...result.items);
    if (items.length >= result.total || result.items.length < PAGE_SIZE) break;
  }
  // Sin stock (stock trackeado en 0) no se puede pedir.
  return items.filter((item) => item.stock === null || item.stock > 0);
}

export function useOrderableProducts(
  businessId: string | null,
  branchId: string | null,
  enabled = true
) {
  return useQuery<InventoryItem[], Error>({
    queryKey: [
      ...BRANCH_INVENTORY_KEYS.byBranch(businessId || "", branchId || ""),
      "orderable",
    ],
    queryFn: () => getAllOrderableProducts(businessId!, branchId!),
    enabled: enabled && !!businessId && !!branchId,
    staleTime: 30 * 1000,
  });
}
