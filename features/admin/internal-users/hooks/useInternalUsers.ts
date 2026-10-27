import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as service from "../services/internal-users.service";
import type {
  CreateInternalUserInput,
  PlatformProfileInput,
  UpdateInternalUserInput,
} from "../types";

export const INTERNAL_USERS_KEYS = {
  all: ["admin", "internal-users"] as const,
  users: () => [...INTERNAL_USERS_KEYS.all, "users"] as const,
  profiles: () => [...INTERNAL_USERS_KEYS.all, "profiles"] as const,
  permissions: () => [...INTERNAL_USERS_KEYS.all, "permissions"] as const,
};

export function useInternalUsers(enabled = true) {
  return useQuery({
    queryKey: INTERNAL_USERS_KEYS.users(),
    queryFn: service.getInternalUsers,
    enabled,
  });
}

export function usePlatformProfiles(enabled = true) {
  return useQuery({
    queryKey: INTERNAL_USERS_KEYS.profiles(),
    queryFn: service.getPlatformProfiles,
    enabled,
  });
}

export function usePlatformPermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: INTERNAL_USERS_KEYS.permissions(),
    queryFn: service.getPlatformPermissions,
    staleTime: Infinity,
    enabled,
  });
}

/** Invalida usuarios y perfiles (el conteo de usuarios por perfil cambia). */
function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: INTERNAL_USERS_KEYS.all });
}

export function useCreateInternalUser() {
  const t = useTranslations("admin-internal-users");
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (data: CreateInternalUserInput) => service.createInternalUser(data),
    onSuccess: () => {
      toast.success(t("users.notifications.created"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || t("errors.generic")),
  });
}

export function useUpdateInternalUser() {
  const t = useTranslations("admin-internal-users");
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInternalUserInput }) =>
      service.updateInternalUser(id, data),
    onSuccess: () => {
      toast.success(t("users.notifications.updated"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || t("errors.generic")),
  });
}

export function useSavePlatformProfile() {
  const t = useTranslations("admin-internal-users");
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: PlatformProfileInput }) =>
      id ? service.updatePlatformProfile(id, data) : service.createPlatformProfile(data),
    onSuccess: () => {
      toast.success(t("profiles.notifications.saved"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || t("errors.generic")),
  });
}

export function useDeletePlatformProfile() {
  const t = useTranslations("admin-internal-users");
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => service.deletePlatformProfile(id),
    onSuccess: () => {
      toast.success(t("profiles.notifications.deleted"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || t("errors.generic")),
  });
}
