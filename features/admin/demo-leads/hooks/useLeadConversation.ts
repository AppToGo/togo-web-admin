/**
 * Hooks de la conversación de un lead con el WhatsApp de la demo.
 *
 * El usuario de plataforma no está en el room WebSocket del negocio demo,
 * así que no hay realtime: la query refresca por polling mientras la pestaña
 * del navegador está visible.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import type { SendMessageParams } from "@/features/conversations";
import {
  getDemoLeadConversation,
  releaseDemoLeadConversation,
  sendDemoLeadConversationTemplate,
  sendDemoLeadConversationMessage,
  takeoverDemoLeadConversation,
  type DemoLeadConversationResponse,
} from "../services/demo-leads.service";
import type { DemoLeadTemplateErrorCode } from "@/types/auth.types";
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

function useInvalidateLeadConversation(leadId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: LEAD_CONVERSATION_KEY(leadId) });
}

export function useTakeoverLeadConversation(leadId: string) {
  const t = useTranslations("inbox");
  const invalidate = useInvalidateLeadConversation(leadId);
  return useMutation({
    mutationFn: () => takeoverDemoLeadConversation(leadId),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.takeoverFailed"));
    },
  });
}

export function useReleaseLeadConversation(leadId: string) {
  const t = useTranslations("inbox");
  const invalidate = useInvalidateLeadConversation(leadId);
  return useMutation({
    mutationFn: (note?: string) => releaseDemoLeadConversation(leadId, note),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error) || t("errors.releaseFailed"));
    },
  });
}

export function useSendLeadConversationMessage(leadId: string) {
  const invalidate = useInvalidateLeadConversation(leadId);
  return useMutation({
    mutationFn: (params: SendMessageParams) =>
      sendDemoLeadConversationMessage(leadId, params),
    onSuccess: invalidate,
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error));
    },
  });
}

const TEMPLATE_ERROR_CODES: readonly DemoLeadTemplateErrorCode[] = [
  "LEAD_REVOKED",
  "DO_NOT_CONTACT",
  "WINDOW_OPEN",
  "TEMPLATE_ALREADY_SENT",
  "TEMPLATE_UNAVAILABLE",
  "TEMPLATE_DAILY_LIMIT",
  "PROVIDER_SEND_FAILED",
];

/** Código `{code, message}` del error del envío por plantilla, si lo trae. */
export function templateErrorCodeOf(
  error: unknown
): DemoLeadTemplateErrorCode | null {
  const code = (error as { response?: { data?: { code?: unknown } } })
    ?.response?.data?.code;
  return TEMPLATE_ERROR_CODES.find((c) => c === code) ?? null;
}

/**
 * Envío con plantilla aprobada cuando la ventana de 24 h está cerrada.
 * Invalida la conversación y el lead (el evento queda en su línea de tiempo).
 */
export function useSendLeadConversationTemplate(leadId: string) {
  const t = useTranslations("admin-demo-leads");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      sendDemoLeadConversationTemplate(leadId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_CONVERSATION_KEY(leadId) });
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DEMO_LEADS_KEYS.detail(leadId) });
      toast.success(t("template.sent"));
    },
    onError: (error) => {
      const code = templateErrorCodeOf(error);
      toast.error(
        code ? t(`template.errors.${code}`) : t("template.errors.generic")
      );
    },
  });
}
