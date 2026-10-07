"use client";

import { useEffect } from "react";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useOrdersRealtime } from "@/features/orders/hooks/useOrdersRealtime";
import { useConversationsRealtime } from "@/features/conversations/hooks/useConversationsRealtime";
import { useHydrateNotificationPreferences } from "@/features/notifications/stores";
import { useRealtimeStatusStore } from "@/stores/realtime-status.store";

/**
 * Sockets globales del dashboard (sin UI). Viven en el layout para que el
 * sonido de pedido nuevo / solicitud de asesor y los badges del sidebar
 * funcionen en cualquier pantalla, con una sola conexión por namespace.
 *
 * `/conversations` solo se abre con `conversation.view`: el gateway rechaza
 * al resto y el cliente reintentaría para siempre.
 */
export function DashboardRealtime() {
  useHydrateNotificationPreferences();

  const isSuperAdmin = useIsSuperAdmin();
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const canViewConversations =
    !isSuperAdmin && !permissionsLoading && hasPermission("conversation.view");

  const orders = useOrdersRealtime();
  const conversations = useConversationsRealtime(canViewConversations);

  const setOrdersConnected = useRealtimeStatusStore((s) => s.setOrdersConnected);
  const setConversationsConnected = useRealtimeStatusStore(
    (s) => s.setConversationsConnected
  );
  useEffect(() => {
    setOrdersConnected(orders.isConnected);
  }, [orders.isConnected, setOrdersConnected]);
  useEffect(() => {
    setConversationsConnected(conversations.isConnected);
  }, [conversations.isConnected, setConversationsConnected]);

  return null;
}
