/**
 * Hooks de la conversación de un lead con el WhatsApp de la demo.
 *
 * El usuario de plataforma no está en el room WebSocket del negocio demo,
 * así que no hay realtime: la query refresca por polling mientras la pestaña
 * del navegador está visible.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import type { SendMessageParams } from "@/features/conversations";
import {
  getDemoLeadConversation,
  releaseDemoLeadConversation,
  sendDemoLeadConversationMessage,
  takeoverDemoLeadConversation,
  type DemoLeadConversationResponse,
} from "../services/demo-leads.service";
import { DEMO_LEADS_KEYS } from "./useDemoLeads";

/** Intervalo de refresco de la conversación (ms). */
export const LEAD_CONVERSATION_POLL_MS = 5000;

export const LEAD_CONVERSATION_KEY = (leadId: string) =>
  [...DEMO_LEADS_KEYS.all, "conversation", leadId] as const;

export function useLeadConversation(leadId: string | null, enabled = true) {
  return useQuery<DemoLeadConversationResponse, Error>({
    queryKey: LEAD_CONVERSATION_KEY(leadId ?? ""),
    queryFn: () => getDemoLeadConversation(leadId!),
    enabled: !!leadId && enabled,
    // Por defecto TanStack no refresca en segundo plano (el tab oculto no
    // dispara polling), que es justo lo que se quiere.
    refetchInterval: LEAD_CONVERSATION_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** Estados HTTP que indican que la vista de la conversación quedó vieja. */
const STALE_CONVERSATION_STATUSES = [409, 422];

function useInvalidateLeadConversation(leadId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: LEAD_CONVERSATION_KEY(leadId) });
}

/**
 * Ante 409 (CONVERSATION_ALREADY_TAKEN, CONTROL_NOT_HELD, SESSION_CLOSED o
 * handoff deshabilitado) o 422 (OUTSIDE_24H_WINDOW) la UI quedó desactualizada
 * (botón "Tomar" o composer que ya no aplican): se refresca la conversación y
 * se muestra el mensaje humanizado del backend.
 */
function useLeadConversationErrorHandler(leadId: string, fallback?: string) {
  const invalidate = useInvalidateLeadConversation(leadId);
  return (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.response &&
      STALE_CONVERSATION_STATUSES.includes(error.response.status)
    ) {
      void invalidate();
    }
    toast.error(getHumanizedErrorMessage(error) || fallback);
  };
}

export function useTakeoverLeadConversation(leadId: string) {
  const t = useTranslations("inbox");
  const invalidate = useInvalidateLeadConversation(leadId);
  const handleError = useLeadConversationErrorHandler(
    leadId,
    t("errors.takeoverFailed")
  );
  return useMutation({
    mutationFn: () => takeoverDemoLeadConversation(leadId),
    onSuccess: invalidate,
    onError: handleError,
  });
}

export function useReleaseLeadConversation(leadId: string) {
  const t = useTranslations("inbox");
  const invalidate = useInvalidateLeadConversation(leadId);
  const handleError = useLeadConversationErrorHandler(
    leadId,
    t("errors.releaseFailed")
  );
  return useMutation({
    mutationFn: (note?: string) => releaseDemoLeadConversation(leadId, note),
    onSuccess: invalidate,
    onError: handleError,
  });
}

export function useSendLeadConversationMessage(leadId: string) {
  const invalidate = useInvalidateLeadConversation(leadId);
  const handleError = useLeadConversationErrorHandler(leadId);
  return useMutation({
    mutationFn: (params: SendMessageParams) =>
      sendDemoLeadConversationMessage(leadId, params),
    onSuccess: invalidate,
    onError: handleError,
  });
}
