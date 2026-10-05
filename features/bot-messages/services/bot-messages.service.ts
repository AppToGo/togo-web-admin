/**
 * Mensajes del asistente (plan bot natural, T22)
 * /v1/businesses/:businessId/bot-messages
 */

import apiClient from "@/services/api.service";
import type {
  BotMessage,
  BotMessageRun,
  BotMessagesCatalog,
  GenerateBotMessagesRequest,
} from "../types/bot-messages.types";

const base = (businessId: string) => `/businesses/${businessId}/bot-messages`;
const message = (businessId: string, templateId: string) =>
  `${base(businessId)}/${encodeURIComponent(templateId)}`;

export async function getBotMessages(
  businessId: string
): Promise<BotMessagesCatalog> {
  const { data } = await apiClient.get<BotMessagesCatalog>(base(businessId));
  return data;
}

export async function saveBotMessageDraft(
  businessId: string,
  templateId: string,
  variants: string[]
): Promise<BotMessage> {
  const { data } = await apiClient.put<BotMessage>(
    `${message(businessId, templateId)}/draft`,
    { variants }
  );
  return data;
}

export async function resetBotMessage(
  businessId: string,
  templateId: string
): Promise<BotMessage> {
  const { data } = await apiClient.delete<BotMessage>(
    message(businessId, templateId)
  );
  return data;
}

export async function regenerateBotMessage(
  businessId: string,
  templateId: string
): Promise<BotMessage> {
  const { data } = await apiClient.post<BotMessage>(
    `${message(businessId, templateId)}/regenerate`
  );
  return data;
}

export async function publishBotMessages(
  businessId: string
): Promise<{ version: number; published: number }> {
  const { data } = await apiClient.post<{ version: number; published: number }>(
    `${base(businessId)}/publish`
  );
  return data;
}

export async function discardBotMessagesDraft(
  businessId: string
): Promise<void> {
  await apiClient.delete(`${base(businessId)}/draft`);
}

export async function generateBotMessages(
  businessId: string,
  request: GenerateBotMessagesRequest
): Promise<BotMessageRun> {
  const { data } = await apiClient.post<BotMessageRun>(
    `${base(businessId)}/generate`,
    request
  );
  return data;
}

export async function getBotMessagesRun(
  businessId: string,
  runId: string
): Promise<BotMessageRun> {
  const { data } = await apiClient.get<BotMessageRun>(
    `${base(businessId)}/generate/${runId}`
  );
  return data;
}
