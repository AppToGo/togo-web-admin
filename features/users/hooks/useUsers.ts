/**
 * Users Hooks
 *
 * Hooks para obtener datos de usuarios usando TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service";
import type { User, CreateUserRequest, UpdateUserRequest } from "../types";

const USERS_KEYS = {
  all: ["users"] as const,
  lists: () => [...USERS_KEYS.all, "list"] as const,
  detail: (id: string) => [...USERS_KEYS.all, "detail", id] as const,
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook para obtener todos los usuarios del negocio actual
 */
export function useUsers() {
  const { user } = useAuthStore();
  const businessId = user?.businessId;

  return useQuery<User[], Error>({
    queryKey: USERS_KEYS.lists(),
    queryFn: getUsers,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook para obtener un usuario específico por ID
 */
export function useUser(id: string | null) {
  const { user } = useAuthStore();
  const businessId = user?.businessId;

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
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
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
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
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
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
    },
  });
}
