'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Type for the notifyNewOrder function
interface NotifyNewOrderFn {
  (orderId: string): void;
}
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useBusinessStore } from '@/features/business/stores/business.store';
import { APP_CONFIG } from '@/config/app.config';
import { ORDERS_KEYS } from '../types/order-cache.types';
import { METRICS_KEYS } from './useOrderMetrics';
import { useOrderNotification } from '@/features/notifications/hooks/useOrderNotification';
import { ARCHIVE_STATUS } from '../constants/order-statuses';
import {
  isRefreshInProgress,
  waitForRefresh,
  startGlobalRefresh,
  clearGlobalRefreshState,
} from '@/services/auth-sync.service';
import { forceLogout } from '@/services/session.service';

// WebSocket URL con fallback más robusto
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ||
  'http://localhost:3000';

// Constantes para eventos de WebSocket
const WS_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_PAYMENT_UPDATED: 'order:paymentUpdated',
  METRICS_UPDATED: 'order:metricsUpdated',
  OPERATOR_JOINED: 'operator:joined',
  OPERATOR_LEFT: 'operator:left',
  AUTH_ERROR: 'auth_error',
} as const;

// Interfaces para eventos
interface OrderCreatedEvent {
  orderId: string;
  status: string;
  timestamp: string;
}

interface OrderUpdatedEvent {
  orderId: string;
  newStatus: string;
  previousStatus?: string;
  timestamp: string;
}

interface OrderPaymentUpdatedEvent {
  orderId: string;
  newStatus: string;
  timestamp: string;
}

interface OperatorEvent {
  userId: string;
}


// Utilidad para console.debug solo en desarrollo
const debugLog = (message: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(message, ...args);
  }
};

export interface RealtimeState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useOrdersRealtime(): RealtimeState {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();
  const businessId = selectedBusinessId || user?.businessId || null;
  
  // Use the order notification hook for sound + toast notifications
  const { notifyNewOrder } = useOrderNotification();
  
  // Use ref pattern to avoid re-triggering socket connection when preferences change
  const notifyNewOrderRef = useRef<NotifyNewOrderFn>(notifyNewOrder);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    notifyNewOrderRef.current = notifyNewOrder;
  }, [notifyNewOrder]);

  const getToken = useCallback(() => useAuthStore.getState().accessToken, []);

  // Reusa el MISMO mutex global que el interceptor HTTP (api.service.ts) en
  // vez de refrescar por su cuenta. El refresh token del backend es de un
  // solo uso (rota y revoca el anterior en cada llamada — auth.service.ts),
  // así que dos refrescos concurrentes y no coordinados (uno del socket, otro
  // de una petición HTTP) competían por el mismo cookie: el que perdía la
  // carrera recibía un refresh token ya revocado, y esa falla terminaba
  // desloguenado al usuario aunque el otro refresh hubiera tenido éxito
  // segundos antes. Ver auth-sync.service.ts para el porqué del mutex.
  const refreshAndReconnect = useCallback(
    async (socket: Socket) => {
      if (isRefreshInProgress()) {
        const token = await waitForRefresh();
        if (token) {
          socket.auth = { token, businessId };
          socket.connect();
        } else {
          socket.disconnect();
        }
        return;
      }

      const token = await startGlobalRefresh(async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          useAuthStore.getState().setAuthData(data);
          return { success: true, token: data.access_token };
        } catch (err) {
          return {
            success: false,
            token: null,
            error: err instanceof Error ? err : new Error('Refresh failed'),
          };
        }
      });

      if (token) {
        socket.auth = { token, businessId };
        socket.connect();
      } else {
        // Refresh genuinamente fallido (no solo perdió la carrera con otro
        // refresh): mismo tratamiento que el interceptor HTTP — limpiar el
        // estado de auth y navegar a login, en vez de dejar al usuario en un
        // estado "logueado" pero con el socket permanentemente desconectado.
        useAuthStore.getState().clearAuth();
        clearGlobalRefreshState();
        forceLogout('session_expired');
        socket.disconnect();
      }
    },
    [businessId]
  );

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    if (!APP_CONFIG.features.enableWebSockets || !businessId || !getToken() || user?.role === 'SUPER_ADMIN') {
      setState({ isConnected: false, isConnecting: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    // Socket con businessId en el handshake
    const socket = io(`${WS_URL}/orders`, {
      auth: { token: getToken(), businessId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState({ isConnected: true, isConnecting: false, error: null });
    });

    socket.on('disconnect', (reason) => {
      setState({ isConnected: false, isConnecting: true, error: null });
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', async (error) => {
      setState({ isConnected: false, isConnecting: false, error: error.message });
    });

    socket.on(WS_EVENTS.AUTH_ERROR, async ({ message }: { message: string }) => {
      if (message === 'token_expired') {
        await refreshAndReconnect(socket);
      }
    });

    socket.on(WS_EVENTS.ORDER_CREATED, (data: OrderCreatedEvent) => {
      // Invalidar cache de órdenes LIVE del negocio (nueva orden siempre va a CONFIRMED)
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'live'],
      });
      
      // Trigger notification (sound + toast) based on user preferences
      notifyNewOrderRef.current(data.orderId);
    });

    socket.on(WS_EVENTS.ORDER_UPDATED, (data: OrderUpdatedEvent) => {
      // Actualizar detalle de orden en cache
      queryClient.setQueryData(ORDERS_KEYS.detail(data.orderId), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, status: data.newStatus, updatedAt: data.timestamp };
      });
      
      // Invalidar cache de órdenes LIVE (orden movió de columna)
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'live'],
      });
      
      // Si la orden llegó a COMPLETED, invalidar también el cache de completadas
      if (data.newStatus === ARCHIVE_STATUS) {
        queryClient.invalidateQueries({
          queryKey: [...ORDERS_KEYS.all, businessId, 'completed'],
        });
      }
    });

    socket.on(WS_EVENTS.ORDER_PAYMENT_UPDATED, (data: OrderPaymentUpdatedEvent) => {
      // Actualizar detalle de orden en cache
      queryClient.setQueryData(ORDERS_KEYS.detail(data.orderId), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, paymentStatus: data.newStatus, updatedAt: data.timestamp };
      });
      
      // Actualizar también en cache de órdenes LIVE
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'live'],
      });
      
      // También invalidar completed (pago puede cambiar en órdenes completadas)
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'completed'],
      });
    });

    socket.on(WS_EVENTS.METRICS_UPDATED, () => {
      // Invalidar métricas solo del negocio actual — no afecta otros negocios
      // El backend emite esta señal máximo 1 vez cada 10s por negocio (Redis debounce)
      queryClient.invalidateQueries({
        queryKey: METRICS_KEYS.business(businessId ?? undefined),
      });
    });

    socket.on(WS_EVENTS.OPERATOR_JOINED, ({ userId }: OperatorEvent) => {
      debugLog('[WS] Operador conectado:', userId);
    });

    socket.on(WS_EVENTS.OPERATOR_LEFT, ({ userId }: OperatorEvent) => {
      debugLog('[WS] Operador desconectado:', userId);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setState({ isConnected: false, isConnecting: false, error: null });
    };
  }, [businessId, getToken, queryClient, refreshAndReconnect]);

  return state;
}
