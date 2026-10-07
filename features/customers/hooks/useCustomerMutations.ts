/**
 * Customer Mutations Hooks
 *
 * Hooks para realizar mutaciones en clientes con optimistic UI.
 * - Actualización de cliente
 * - Invalidación automática de queries
 * - Toast notifications con sonner
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { updateCustomer } from "../services/customer.service";
import { CUSTOMERS_KEYS } from "./useCustomers";
import type { Customer, UpdateCustomerRequest } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para actualizar un cliente
 *
 * Implementa optimistic UI con rollback automático en caso de error.
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { selectedBusinessId } = useBusinessStore();
  const { user } = useAuthStore.getState();
  const t = useTranslations("customers");

  // Determinar el businessId efectivo
  const effectiveBusinessId =
    selectedBusinessId || user?.businessId || undefined;

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: UpdateCustomerRequest;
    }) => updateCustomer(customerId, data, effectiveBusinessId),

    // Optimistic update
    onMutate: async ({ customerId, data }) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: CUSTOMERS_KEYS.all });

      // Guardar estado anterior para rollback
      const previousCustomers = queryClient.getQueryData<Customer[]>(
        CUSTOMERS_KEYS.lists()
      );
      const previousCustomer = queryClient.getQueryData<Customer>(
        CUSTOMERS_KEYS.detail(customerId)
      );

      // Actualizar lista de clientes
      queryClient.setQueriesData<Customer[]>(
        { queryKey: CUSTOMERS_KEYS.lists() },
        (old: Customer[] | undefined) => {
          if (!old) return old;
          return old.map((customer) =>
            customer.id === customerId ? { ...customer, ...data } : customer
          );
        }
      );

      // Actualizar detalle del cliente
      queryClient.setQueryData<Customer>(
        CUSTOMERS_KEYS.detail(customerId),
        (old) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );

      return { previousCustomers, previousCustomer };
    },

    // Rollback on error
    onError: (err, { customerId }, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(
          CUSTOMERS_KEYS.lists(),
          context.previousCustomers
        );
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          CUSTOMERS_KEYS.detail(customerId),
          context.previousCustomer
        );
      }

      // Mostrar error
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("errors.updateFailed"));
    },

    // Success
    onSuccess: () => {
      toast.success(t("updateSuccess"));
    },

    // Revalidar después de la mutación
    onSettled: (_data, _error, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CUSTOMERS_KEYS.detail(customerId),
      });
    },
  });
}
