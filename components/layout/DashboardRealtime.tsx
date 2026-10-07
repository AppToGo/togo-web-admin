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
 * Cada socket se abre solo con el permiso de su pantalla: `/orders` con
 * `order.view` (sin él, el usuario no puede ver el pedido que le suena) y
 * `/conversations` con `conversation.view` (el gateway rechaza al resto y el
 * cliente reintentaría para siempre). Efecto consciente: con `order.view`
 * pero sin `conversation.view`, el tab "Conversación" del detalle de pedido
 * pierde el vivo y depende de refetch.
 */
export function DashboardRealtime() {
  useHydrateNotificationPreferences();

  const isSuperAdmin = useIsSuperAdmin();
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const canUse = (permission: string) =>
    !isSuperAdmin && !permissionsLoading && hasPermission(permission);

  const orders = useOrdersRealtime(canUse("order.view"));
  const conversations = useConversationsRealtime(canUse("conversation.view"));

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
