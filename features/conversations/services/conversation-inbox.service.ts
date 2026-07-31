/**
 * Conversation Inbox Service (Fase C, Etapa 3)
 *
 * Escrituras del inbox — `src/conversation-inbox` en el backend. Mismo
 * criterio de resolución de `businessId` que `conversation.service.ts`
 * (Fase B), reusado vía `getConversationsBaseUrl`.
 */

import apiClient from "@/services/api.service";
import type {
  AssignableUser,
  ConversationEvent,
  ConversationMessage,
  ConversationSessionSummary,
} from "../types";
import { getConversationsBaseUrl } from "./conversation.service";

export interface SendMessageParams {
  text: string;
  replyToWaMessageId?: string;
}

export interface AddNoteParams {
  text: string;
  mentions?: string[];
}

export interface CloseConversationParams {
  outcome?: string;
}

async function post<T>(
  sessionId: string,
  action: string,
  body: unknown,
  businessId?: string
): Promise<T> {
  const { data } = await apiClient.post<T>(
    `${getConversationsBaseUrl(businessId)}/${sessionId}/${action}`,
    body
  );
  return data;
}

export function takeoverConversation(
  sessionId: string,
  businessId?: string
): Promise<ConversationSessionSummary> {
  return post(sessionId, "takeover", {}, businessId);
}

export function releaseConversation(
  sessionId: string,
  note?: string,
  businessId?: string
): Promise<ConversationSessionSummary> {
  return post(sessionId, "release", note ? { note } : {}, businessId);
}

export function sendConversationMessage(
  sessionId: string,
  params: SendMessageParams,
  businessId?: string
): Promise<ConversationMessage> {
  return post(sessionId, "messages", params, businessId);
}

export function addConversationNote(
  sessionId: string,
  params: AddNoteParams,
  businessId?: string
): Promise<ConversationEvent> {
  return post(sessionId, "notes", params, businessId);
}

export async function assignConversation(
  sessionId: string,
  assignedUserId: string | null,
  businessId?: string
): Promise<ConversationSessionSummary> {
  const { data } = await apiClient.patch<ConversationSessionSummary>(
    `${getConversationsBaseUrl(businessId)}/${sessionId}/assignment`,
    { assignedUserId }
  );
  return data;
}

export function closeConversation(
  sessionId: string,
  params: CloseConversationParams = {},
  businessId?: string
): Promise<ConversationSessionSummary> {
  return post(sessionId, "close", params, businessId);
}

export async function markConversationRead(
  sessionId: string,
  businessId?: string
): Promise<void> {
  await apiClient.post(
    `${getConversationsBaseUrl(businessId)}/${sessionId}/read`
  );
}

/**
 * `{id, name}` de usuarios del negocio para el diálogo de asignación —
 * deliberadamente distinto de `useUsers` (features/users): ese hook pega a
 * `GET /businesses/:businessId/users`, que exige `user.view` (permiso de
 * administración). Este endpoint solo exige `conversation.assign`, el
 * mismo permiso que ya hace falta para abrir el diálogo.
 */
export async function getAssignableUsers(
  businessId?: string
): Promise<AssignableUser[]> {
  const { data } = await apiClient.get<AssignableUser[]>(
    `${getConversationsBaseUrl(businessId)}/assignable-users`
  );
  return data;
}
