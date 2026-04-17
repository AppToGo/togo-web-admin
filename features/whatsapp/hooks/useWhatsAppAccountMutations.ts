/**
 * WhatsApp Account Mutations Hooks
 *
 * Hooks para realizar mutaciones en cuentas de WhatsApp con optimistic UI.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createWhatsAppAccount,
  updateWhatsAppAccount,
  deleteWhatsAppAccount,
} from "../services/whatsapp.service";
import {
  WHATSAPP_ACCOUNTS_KEYS,
  WHATSAPP_ROUTING_KEYS,
} from "./query-keys";
import type {
  WhatsAppAccount,
  CreateWhatsAppAccountRequest,
  UpdateWhatsAppAccountRequest,
} from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para crear una nueva cuenta de WhatsApp
 */
export function useCreateWhatsAppAccount() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: (data: CreateWhatsAppAccountRequest) =>
      createWhatsAppAccount(data),

    onSuccess: () => {
      toast.success(t("accounts.createSuccess"));
    },

    onError: (err) => {
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("accounts.errors.createFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ACCOUNTS_KEYS.lists(),
      });
    },
  });
}

/**
 * Hook para actualizar una cuenta de WhatsApp existente
 */
export function useUpdateWhatsAppAccount() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWhatsAppAccountRequest;
    }) => updateWhatsAppAccount(id, data),

    onSuccess: () => {
      toast.success(t("accounts.updateSuccess"));
    },

    onError: (err) => {
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("accounts.errors.updateFailed"));
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ACCOUNTS_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ACCOUNTS_KEYS.detail(id),
      });
    },
  });
}

/**
 * Hook para eliminar una cuenta de WhatsApp con optimistic UI
 */
export function useDeleteWhatsAppAccount() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: (id: string) => deleteWhatsAppAccount(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: WHATSAPP_ACCOUNTS_KEYS.all,
      });

      const previousAccounts = queryClient.getQueryData<WhatsAppAccount[]>(
        WHATSAPP_ACCOUNTS_KEYS.lists()
      );

      queryClient.setQueryData<WhatsAppAccount[]>(
        WHATSAPP_ACCOUNTS_KEYS.lists(),
        (old) => {
          if (!old) return old;
          return old.filter((account) => account.id !== id);
        }
      );

      queryClient.removeQueries({
        queryKey: WHATSAPP_ACCOUNTS_KEYS.detail(id),
      });

      return { previousAccounts };
    },

    onError: (err, _id, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(
          WHATSAPP_ACCOUNTS_KEYS.lists(),
          context.previousAccounts
        );
      }
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("accounts.errors.deleteFailed"));
    },

    onSuccess: () => {
      toast.success(t("accounts.deleteSuccess"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ACCOUNTS_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.lists(),
      });
    },
  });
}
