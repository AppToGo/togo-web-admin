"use client";

/**
 * Mensajes del asistente (plan bot natural, T22): hooks de TanStack Query.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  discardBotMessagesDraft,
  generateBotMessages,
  getBotMessages,
  getBotMessagesRun,
  publishBotMessages,
  regenerateBotMessage,
  resetBotMessage,
  saveBotMessageDraft,
} from "../services/bot-messages.service";
import type {
  BotMessage,
  BotMessagesCatalog,
  GenerateBotMessagesRequest,
} from "../types/bot-messages.types";

export const BOT_MESSAGES_KEYS = {
  all: ["bot-messages"] as const,
  catalog: (businessId: string) =>
    [...BOT_MESSAGES_KEYS.all, "catalog", businessId] as const,
  run: (businessId: string, runId: string) =>
    [...BOT_MESSAGES_KEYS.all, "run", businessId, runId] as const,
};

/** Polling del progreso de "Editar con IA". */
const RUN_POLL_MS = 2000;

export function useBotMessages(businessId: string | undefined) {
  return useQuery<BotMessagesCatalog>({
    queryKey: BOT_MESSAGES_KEYS.catalog(businessId ?? ""),
    queryFn: () => getBotMessages(businessId!),
    enabled: !!businessId,
    retry: false,
  });
}

/** Reemplaza un mensaje en el catálogo cacheado (sin volver a pedirlo todo). */
function useReplaceMessage(businessId: string) {
  const queryClient = useQueryClient();
  return (updated: BotMessage) =>
    queryClient.setQueryData<BotMessagesCatalog>(
      BOT_MESSAGES_KEYS.catalog(businessId),
      (catalog) => {
        if (!catalog) return catalog;
        const stages = catalog.stages.map((stage) => ({
          ...stage,
          messages: stage.messages.map((m) =>
            m.id === updated.id ? updated : m
          ),
        }));
        return {
          ...catalog,
          stages,
          hasDraft: stages.some((s) => s.messages.some((m) => m.draft)),
        };
      }
    );
}

export function useSaveBotMessageDraft(businessId: string) {
  const replace = useReplaceMessage(businessId);
  return useMutation({
    mutationFn: (input: { templateId: string; variants: string[] }) =>
      saveBotMessageDraft(businessId, input.templateId, input.variants),
    onSuccess: replace,
  });
}

export function useResetBotMessage(businessId: string) {
  const replace = useReplaceMessage(businessId);
  return useMutation({
    mutationFn: (templateId: string) => resetBotMessage(businessId, templateId),
    onSuccess: replace,
  });
}

export function useRegenerateBotMessage(businessId: string) {
  const replace = useReplaceMessage(businessId);
  return useMutation({
    mutationFn: (templateId: string) =>
      regenerateBotMessage(businessId, templateId),
    onSuccess: replace,
  });
}

function useInvalidateCatalog(businessId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: BOT_MESSAGES_KEYS.catalog(businessId),
    });
}

export function usePublishBotMessages(businessId: string) {
  const invalidate = useInvalidateCatalog(businessId);
  return useMutation({
    mutationFn: () => publishBotMessages(businessId),
    onSuccess: invalidate,
  });
}

export function useDiscardBotMessagesDraft(businessId: string) {
  const invalidate = useInvalidateCatalog(businessId);
  return useMutation({
    mutationFn: () => discardBotMessagesDraft(businessId),
    onSuccess: invalidate,
  });
}

export function useGenerateBotMessages(businessId: string) {
  return useMutation({
    mutationFn: (request: GenerateBotMessagesRequest) =>
      generateBotMessages(businessId, request),
  });
}

/** Progreso de una ejecución; deja de consultar al terminar. */
export function useBotMessagesRun(businessId: string, runId: string | null) {
  return useQuery({
    queryKey: BOT_MESSAGES_KEYS.run(businessId, runId ?? ""),
    queryFn: () => getBotMessagesRun(businessId, runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : RUN_POLL_MS;
    },
  });
}
