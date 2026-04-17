/**
 * WhatsApp Routing Mutations Hooks
 *
 * Hooks para realizar mutaciones en reglas de enrutamiento de WhatsApp.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createWhatsAppRouting,
  updateWhatsAppRouting,
  deleteWhatsAppRouting,
} from "../services/whatsapp.service";
import { WHATSAPP_ROUTING_KEYS } from "./query-keys";
import type {
  WhatsAppRouting,
  CreateWhatsAppRoutingRequest,
  UpdateWhatsAppRoutingRequest,
} from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

/**
 * Hook para crear una nueva regla de enrutamiento de WhatsApp
 */
export function useCreateWhatsAppRouting() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: (data: CreateWhatsAppRoutingRequest) =>
      createWhatsAppRouting(data),

    onError: (err) => {
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("accounts.errors.createFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.lists(),
      });
    },
  });
}

/**
 * Hook para actualizar una regla de enrutamiento de WhatsApp
 */
export function useUpdateWhatsAppRouting() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWhatsAppRoutingRequest;
    }) => updateWhatsAppRouting(id, data),

    onError: (err) => {
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("accounts.errors.updateFailed"));
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.detail(id),
      });
    },
  });
}

/**
 * Hook para eliminar una regla de enrutamiento con optimistic UI
 */
export function useDeleteWhatsAppRouting() {
  const queryClient = useQueryClient();
  const t = useTranslations("whatsapp");

  return useMutation({
    mutationFn: (id: string) => deleteWhatsAppRouting(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.all,
      });

      const previousRoutings = queryClient.getQueryData<WhatsAppRouting[]>(
        WHATSAPP_ROUTING_KEYS.lists()
      );

      queryClient.setQueryData<WhatsAppRouting[]>(
        WHATSAPP_ROUTING_KEYS.lists(),
        (old) => {
          if (!old) return old;
          return old.filter((routing) => routing.id !== id);
        }
      );

      queryClient.removeQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.detail(id),
      });

      return { previousRoutings };
    },

    onError: (err, _id, context) => {
      if (context?.previousRoutings) {
        queryClient.setQueryData(
          WHATSAPP_ROUTING_KEYS.lists(),
          context.previousRoutings
        );
      }
      const errorMessage = getHumanizedErrorMessage(err);
      toast.error(errorMessage || t("accounts.errors.deleteFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WHATSAPP_ROUTING_KEYS.lists(),
      });
    },
  });
}
