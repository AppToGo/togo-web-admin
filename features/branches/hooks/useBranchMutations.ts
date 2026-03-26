/**
 * Branch Mutations Hooks
 *
 * Hooks para realizar mutaciones en sucursales con optimistic UI.
 * - Crear, actualizar, eliminar sucursales
 * - Establecer sucursal principal
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  setMainBranch,
} from "../services/branch.service";
import { BRANCHES_KEYS } from "./query-keys";
import type { Branch, CreateBranchRequest, UpdateBranchRequest } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import { useBranchStore } from "@/stores/branch.store";

/**
 * Hook para crear una nueva sucursal
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();
  const t = useTranslations("branches");

  return useMutation({
    mutationFn: (data: CreateBranchRequest) => createBranch(data),

    // Optimistic update
    onMutate: async (data) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: BRANCHES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousBranches = queryClient.getQueryData<Branch[]>(
        BRANCHES_KEYS.lists()
      );

      // Crear sucursal temporal optimista
      const optimisticBranch: Branch = {
        id: `temp-${Date.now()}`,
        businessId: "", // Se asigna en el backend
        name: data.name,
        slug: data.slug,
        code: data.code,
        isMainBranch: false,
        isActive: true,
        whatsappPhoneNumber: data.whatsappPhoneNumber || null,
        whatsappPhoneNumberId: data.whatsappPhoneNumberId || null,
        whatsappNumbersExtra: null,
        routingMode: data.routingMode,
        address: data.address || null,
        timezone: data.timezone || "America/Lima",
        currency: data.currency || "PEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Actualizar lista de sucursales
      queryClient.setQueryData<Branch[]>(
        BRANCHES_KEYS.lists(),
        (old: Branch[] | undefined) => {
          if (!old) return [optimisticBranch];
          return [...old, optimisticBranch];
        }
      );

      return { previousBranches };
    },

    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(
          BRANCHES_KEYS.lists(),
          context.previousBranches
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.createFailed"));
    },

    // Success
    onSuccess: (newBranch) => {
      toast.success(t("createSuccess", { name: newBranch.name }));
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BRANCHES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BRANCHES_KEYS.canCreate() });
    },
  });
}

/**
 * Hook para actualizar una sucursal existente
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const t = useTranslations("branches");

  return useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: string;
      data: UpdateBranchRequest;
    }) => updateBranch(branchId, data),

    // Optimistic update
    onMutate: async ({ branchId, data }) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: BRANCHES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousBranches = queryClient.getQueryData<Branch[]>(
        BRANCHES_KEYS.lists()
      );
      const previousBranch = queryClient.getQueryData<Branch>(
        BRANCHES_KEYS.detail(branchId)
      );

      // Actualizar lista de sucursales
      queryClient.setQueriesData<Branch[]>(
        { queryKey: BRANCHES_KEYS.lists() },
        (old: Branch[] | undefined) => {
          if (!old) return old;
          return old.map((branch) =>
            branch.id === branchId ? { ...branch, ...data } : branch
          );
        }
      );

      // Actualizar detalle de la sucursal
      queryClient.setQueryData<Branch>(
        BRANCHES_KEYS.detail(branchId),
        (old) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );

      return { previousBranches, previousBranch };
    },

    // Rollback on error
    onError: (err, { branchId }, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(
          BRANCHES_KEYS.lists(),
          context.previousBranches
        );
      }
      if (context?.previousBranch) {
        queryClient.setQueryData(
          BRANCHES_KEYS.detail(branchId),
          context.previousBranch
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.updateFailed"));
    },

    // Success
    onSuccess: (updatedBranch) => {
      toast.success(t("updateSuccess", { name: updatedBranch.name }));
    },

    // Revalidar después de la mutación
    onSettled: (_data, _error, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: BRANCHES_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: BRANCHES_KEYS.detail(branchId),
      });
    },
  });
}

/**
 * Hook para eliminar una sucursal
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const t = useTranslations("branches");

  return useMutation({
    mutationFn: (branchId: string) => deleteBranch(branchId),

    // Optimistic update
    onMutate: async (branchId) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: BRANCHES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousBranches = queryClient.getQueryData<Branch[]>(
        BRANCHES_KEYS.lists()
      );
      const deletedBranch = queryClient.getQueryData<Branch>(
        BRANCHES_KEYS.detail(branchId)
      );

      // Eliminar sucursal de la lista
      queryClient.setQueryData<Branch[]>(
        BRANCHES_KEYS.lists(),
        (old: Branch[] | undefined) => {
          if (!old) return old;
          return old.filter((branch) => branch.id !== branchId);
        }
      );

      // Invalidar detalle
      queryClient.removeQueries({ queryKey: BRANCHES_KEYS.detail(branchId) });

      return { previousBranches, deletedBranch };
    },

    // Rollback on error
    onError: (err, branchId, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(
          BRANCHES_KEYS.lists(),
          context.previousBranches
        );
      }
      if (context?.deletedBranch) {
        queryClient.setQueryData(
          BRANCHES_KEYS.detail(branchId),
          context.deletedBranch
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.deleteFailed"));
    },

    // Success
    onSuccess: (_, branchId) => {
      toast.success(t("deleteSuccess"));
      // Clear store if the deleted branch was selected
      if (useBranchStore.getState().selectedBranchId === branchId) {
        useBranchStore.getState().clearSelectedBranch();
      }
    },

    // Revalidar después de la mutación
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BRANCHES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BRANCHES_KEYS.canCreate() });
    },
  });
}

/**
 * Hook para establecer una sucursal como principal
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 * Cuando se establece una sucursal como principal, las demás dejan de serlo.
 */
export function useSetMainBranch() {
  const queryClient = useQueryClient();
  const t = useTranslations("branches");

  return useMutation({
    mutationFn: (branchId: string) => setMainBranch(branchId),

    // Optimistic update
    onMutate: async (branchId) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: BRANCHES_KEYS.all });

      // Guardar estado anterior para rollback
      const previousBranches = queryClient.getQueryData<Branch[]>(
        BRANCHES_KEYS.lists()
      );
      const previousBranch = queryClient.getQueryData<Branch>(
        BRANCHES_KEYS.detail(branchId)
      );

      // Actualizar lista: la sucursal seleccionada es main, las demás no
      queryClient.setQueryData<Branch[]>(
        BRANCHES_KEYS.lists(),
        (old: Branch[] | undefined) => {
          if (!old) return old;
          return old.map((branch) => ({
            ...branch,
            isMainBranch: branch.id === branchId,
          }));
        }
      );

      // Actualizar detalle
      queryClient.setQueryData<Branch>(
        BRANCHES_KEYS.detail(branchId),
        (old) => {
          if (!old) return old;
          return { ...old, isMainBranch: true };
        }
      );

      return { previousBranches, previousBranch };
    },

    // Rollback on error
    onError: (err, branchId, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(
          BRANCHES_KEYS.lists(),
          context.previousBranches
        );
      }
      if (context?.previousBranch) {
        queryClient.setQueryData(
          BRANCHES_KEYS.detail(branchId),
          context.previousBranch
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.setMainFailed"));
    },

    // Success
    onSuccess: (branch) => {
      toast.success(t("setMainSuccess", { name: branch.name }));
    },

    // Revalidar después de la mutación
    onSettled: (_data, _error, branchId) => {
      queryClient.invalidateQueries({ queryKey: BRANCHES_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: BRANCHES_KEYS.detail(branchId),
      });
    },
  });
}
