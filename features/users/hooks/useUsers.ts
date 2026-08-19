/**
 * Users Hooks
 *
 * Hooks para obtener datos de usuarios usando TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
} from "../services/user.service";
import type { User, CreateUserRequest, UpdateUserRequest } from "../types";

// El listado se cachea por businessId: sin esto, un SUPER_ADMIN que cambia
// de negocio seleccionado (BusinessSelector) seguía viendo el listado de
// usuarios del negocio anterior hasta que expirara el staleTime, porque la
// query key era la misma sin importar qué negocio estuviera activo.
// También se cachea por includeInactive: son dos respuestas de endpoints
// distintos (ver getUsers), compartir key mezclaría ambas.
const USERS_KEYS = {
  all: ["users"] as const,
  lists: (businessId?: string | null, includeInactive = false) =>
    [...USERS_KEYS.all, "list", businessId ?? null, includeInactive] as const,
  detail: (id: string) => [...USERS_KEYS.all, "detail", id] as const,
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook para obtener los usuarios del negocio actual.
 *
 * `includeInactive` trae también los usuarios desactivados (necesario
 * para poder reactivarlos desde el listado) — sin esto quedan
 * invisibles y sin forma de volver a activarlos desde el admin.
 */
export function useUsers(includeInactive = false) {
  // "" es el sentinel de "Todos los negocios" (SUPER_ADMIN sin selección
  // específica) — no hay un único listado de usuarios que mostrar ahí, así
  // que la query se deshabilita igual que con null.
  const businessId = useEffectiveBusinessId();

  return useQuery<User[], Error>({
    queryKey: USERS_KEYS.lists(businessId, includeInactive),
    queryFn: () => getUsers(includeInactive),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook para obtener un usuario específico por ID
 */
export function useUser(id: string | null) {
  const businessId = useEffectiveBusinessId();

  return useQuery<User, Error>({
    queryKey: USERS_KEYS.detail(id || ""),
    queryFn: () => getUserById(id!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!businessId && !!id,
  });
}

/**
 * Hook para crear un nuevo usuario (operador).
 * Invalida lista al éxito y muestra toasts. El límite de plan (USER_LIMIT_EXCEEDED)
 * lo impone el backend atómicamente; acá solo se humaniza el mensaje y se deja
 * que la página decida si abre el modal de upgrade.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      // operatorProfileId no pertenece al DTO de creación — se asigna post-creación
      const { operatorProfileId, ...createDto } = data as CreateUserRequest & { operatorProfileId?: string | null };
      const created = await createUser(createDto);
      if (operatorProfileId) {
        // Asignación best-effort; si falla, el usuario ya quedó creado
        try {
          const { updateUser } = await import("../services/user.service");
          await updateUser(created.id, { operatorProfileId });
        } catch {
          // no bloquea el éxito de la creación
        }
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.detail(variables.id) });
    },
  });
}

/**
 * Hook para eliminar un usuario
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
}

/**
 * Hook para reactivar un usuario previamente eliminado/desactivado
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
}
