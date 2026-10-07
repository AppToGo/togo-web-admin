"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useSelectedBranchIds } from "@/stores/branch.store";
import { useDateFilterParams } from "@/features/filters/hooks";
import { getUnseenOrdersCount, markOrderViewed } from "../services/order.service";
import { ORDERS_KEYS } from "../types/order-cache.types";

// Sin polling: el conteo lo refrescan los eventos del socket.
const UNSEEN_COUNT_STALE_TIME = 60 * 1000;

/**
 * Badge de Pedidos del sidebar: pedidos CONFIRMED que nadie del negocio ha
 * abierto, con los mismos filtros que el tablero (sucursales seleccionadas y
 * rango de fechas). Así todo pedido que cuenta se puede abrir desde la
 * columna y bajar el badge. No hace polling: lo refrescan los eventos
 * `order:created`, `order:updated` y `order:viewed` del socket global
 * (useOrdersRealtime).
 */
export function useUnseenOrdersCount(enabled: boolean = true): number {
  const businessId = useEffectiveBusinessId();
  const branchIds = useSelectedBranchIds();
  const { dateFrom, dateTo } = useDateFilterParams();
  const filters = { branchIds, dateFrom, dateTo };

  const { data } = useQuery({
    queryKey: ORDERS_KEYS.unseenCount(businessId, filters),
    queryFn: () => getUnseenOrdersCount(businessId!, filters),
    enabled: enabled && !!businessId,
    staleTime: UNSEEN_COUNT_STALE_TIME,
  });

  return data ?? 0;
}

/**
 * Marca el pedido como visto para todo el negocio al abrir su detalle en la
 * pantalla de Pedidos. Sin actualización optimista: el front no sabe si el
 * pedido ya estaba visto, así que se refetchea el conteo al responder (el
 * `order:viewed` del socket hace lo mismo en las demás sesiones).
 */
export function useMarkOrderViewed() {
  const queryClient = useQueryClient();
  const businessId = useEffectiveBusinessId();

  return useMutation({
    mutationFn: (orderId: string) => markOrderViewed(orderId, businessId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.unseenCount(businessId) });
    },
  });
}
