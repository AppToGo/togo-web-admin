'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useEffectiveBusinessId } from '@/features/business/stores/business.store';
import { useBranchStore } from '@/stores/branch.store';
import { useSessionStore } from '@/stores/session.store';
import { useDateFilterStore } from '@/features/filters/stores/date-filter.store';
import { APP_CONFIG } from '@/config/app.config';
import { ORDERS_KEYS } from '../types/order-cache.types';
import { METRICS_KEYS } from './useOrderMetrics';
import { useOrderNotification } from '@/features/notifications/hooks/useOrderNotification';

// Derivado de useOrderNotification (no repetido a mano) — así un cambio
// futuro a la firma de notifyNewOrder no puede desincronizarse en
// silencio de lo que este hook le pasa vía el ref.
type NotifyNewOrderFn = ReturnType<typeof useOrderNotification>['notifyNewOrder'];
import { ARCHIVE_STATUS } from '../constants/order-statuses';
import {
  isRefreshInProgress,
  waitForRefresh,
  startGlobalRefresh,
  clearGlobalRefreshState,
} from '@/services/auth-sync.service';
import { forceLogout } from '@/services/session.service';
import { createReconnectScheduler } from '@/lib/socket-reconnect';

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
  ORDER_CUSTOMER_EDIT: 'order:customerEdit',
  ORDER_VIEWED: 'order:viewed',
  ORDER_FLOW_UPDATED: 'order:flowUpdated',
  ORDER_PAYMENT_PROOF: 'order:paymentProof',
  ORDER_PAYMENT_VERIFICATION: 'order:paymentVerification',
  METRICS_UPDATED: 'order:metricsUpdated',
  CASH_SESSION_UPDATED: 'cash:sessionUpdated',
  CASH_COLLECTION_UPDATED: 'cash:collectionUpdated',
  OPERATOR_JOINED: 'operator:joined',
  OPERATOR_LEFT: 'operator:left',
  AUTH_ERROR: 'auth_error',
} as const;

// Interfaces para eventos
interface OrderCreatedEvent {
  orderId: string;
  orderNumber?: string | number | null;
  branchId?: string | null;
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

/**
 * El cliente abrió su pedido para agregarle productos (LOCKED), lo
 * reconfirmó (CONFIRMED), lo descartó (DISCARDED), se le venció (EXPIRED) o
 * el negocio lo movió de estado mientras lo editaba (INTERRUPTED).
 */
interface OrderCustomerEditEvent {
  orderId: string;
  phase: 'LOCKED' | 'CONFIRMED' | 'DISCARDED' | 'EXPIRED' | 'INTERRUPTED';
  changed: boolean;
  timestamp: string;
}

/**
 * Llegó el comprobante de un pedido (`order:paymentProof`) o terminó su
 * análisis (`order:paymentVerification`).
 */
interface OrderPaymentProofEvent {
  orderId: string;
  timestamp: string;
}

interface OperatorEvent {
  userId: string;
}


/**
 * ¿El pedido cuenta en el badge de Pedidos? Mismo alcance que
 * `GET /orders/unseen-count`: las sucursales seleccionadas o, sin selección,
 * las sedes de la sesión del usuario (OWNER: todas). Sin sedes de sesión
 * cargadas no se puede saber y suena: mejor de más que mudo.
 */
function isOrderInBadgeScope(branchId: string | null | undefined): boolean {
  const { selectedBranchIds } = useBranchStore.getState();
  if (selectedBranchIds.length > 0) {
    return !!branchId && selectedBranchIds.includes(branchId);
  }
  if (useAuthStore.getState().user?.role === 'OWNER') return true;
  const sessionBranchIds = useSessionStore.getState().branches.map((b) => b.id);
  if (sessionBranchIds.length === 0) return true;
  return !!branchId && sessionBranchIds.includes(branchId);
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

// Tope de reintentos consecutivos de auth_error antes de dejar de
// reconectar — ver el mismo comentario en useConversationsRealtime.ts (su
// gemelo). Sin esto, un refresh que sigue devolviendo un token que el
// gateway rechaza reintentaba para siempre, manteniendo el ícono de carga
// de la pestaña del browser activo indefinidamente.
const MAX_CONSECUTIVE_AUTH_FAILURES = 3;

export function useOrdersRealtime(enabled: boolean = true): RealtimeState {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const authFailureCountRef = useRef(0);

  const user = useAuthStore((state) => state.user);
  // useEffectiveBusinessId() en vez de `selectedBusinessId || user?.businessId`:
  // ignora un selectedBusinessId obsoleto en localStorage (mismo criterio que
  // useConversationsRealtime).
  const businessId = useEffectiveBusinessId();

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
    if (!enabled || !APP_CONFIG.features.enableWebSockets || !businessId || !getToken() || user?.role === 'SUPER_ADMIN') {
      setState({ isConnected: false, isConnecting: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    // reconnection: false a propósito — competía con refreshAndReconnect()
    // de abajo: el servidor emite 'auth_error' y LUEGO llama disconnect(true)
    // (mismo evento que dispara "io server disconnect" acá), así que un
    // `socket.connect()` inmediato en el handler de "disconnect" ganaba la
    // carrera contra el fetch de refresh (async, más lento) y reconectaba
    // con el token todavía viejo — reintentando para siempre con el mismo
    // resultado. Ahora la única reconexión es la manual, coordinada con el
    // refresh. Ver useConversationsRealtime.ts (su gemelo) para el mismo fix.
    const socket = io(`${WS_URL}/orders`, {
      auth: { token: getToken(), businessId },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 20000,
    });

    socketRef.current = socket;
    let handlingAuthError = false;
    let hasConnectedBefore = false;
    const reconnector = createReconnectScheduler(socket);

    socket.on('connect', () => {
      authFailureCountRef.current = 0;
      reconnector.reset();
      setState({ isConnected: true, isConnecting: false, error: null });
      // Los eventos emitidos mientras el socket estuvo caído se perdieron:
      // refrescar para no mostrar pedidos desactualizados.
      if (hasConnectedBefore) {
        queryClient.invalidateQueries({ queryKey: [...ORDERS_KEYS.all, businessId] });
        queryClient.invalidateQueries({ queryKey: METRICS_KEYS.business(businessId ?? undefined) });
      }
      hasConnectedBefore = true;
    });

    socket.on('disconnect', (reason) => {
      setState({ isConnected: false, isConnecting: true, error: null });
      // El caso de auth ya lo maneja el handler de AUTH_ERROR — reconectar
      // acá también con el mismo token viejo es la carrera que causaba el
      // loop. 'io client disconnect' es un corte nuestro (cleanup/logout).
      if (reason === 'io client disconnect' || handlingAuthError) return;
      reconnector.schedule();
    });

    socket.on('connect_error', (error) => {
      setState({ isConnected: false, isConnecting: true, error: error.message });
      reconnector.schedule();
    });

    socket.on(WS_EVENTS.AUTH_ERROR, async ({ message }: { message: string }) => {
      if (message !== 'token_expired') return;

      handlingAuthError = true;
      authFailureCountRef.current += 1;

      if (authFailureCountRef.current > MAX_CONSECUTIVE_AUTH_FAILURES) {
        setState({ isConnected: false, isConnecting: false, error: 'reconnect_failed' });
        socket.disconnect();
        return;
      }

      await refreshAndReconnect(socket);
      handlingAuthError = false;
    });

    // Badge de Pedidos del sidebar (todas las variantes de sucursales)
    const refreshUnseenCount = () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.unseenCount(businessId) });
    };

    socket.on(WS_EVENTS.ORDER_CREATED, (data: OrderCreatedEvent) => {
      // Si cambió el día desde la última revisión, "Hoy" se corre antes de
      // refetchear: si no, el tablero pediría el día anterior y el pedido
      // nuevo no aparecería.
      useDateFilterStore.getState().recalculateRange();

      // Invalidar cache de órdenes LIVE del negocio (nueva orden siempre va a CONFIRMED)
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'live'],
      });
      refreshUnseenCount();

      // Solo suena si el pedido cuenta en el badge: de una sucursal
      // seleccionada o, sin selección, de una sede asignada al usuario
      // (OWNER ve todas, igual que el backend). Se lee de los stores al
      // llegar el evento para no reconectar el socket al cambiar de sucursal.
      if (!isOrderInBadgeScope(data.branchId)) return;

      // Trigger notification (sound + toast) based on user preferences
      notifyNewOrderRef.current(data.orderId, data.orderNumber);
    });

    // Alguien del negocio abrió un pedido nuevo: baja el badge.
    socket.on(WS_EVENTS.ORDER_VIEWED, refreshUnseenCount);

    // OWNER/ADMIN cambió qué estados usa el negocio: recargar el flujo para
    // no quedar con columnas y botones del flujo viejo (el backend ya
    // rechazaría esos cambios).
    socket.on(WS_EVENTS.ORDER_FLOW_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.flow(businessId) });
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
      // Si salió de CONFIRMED sin abrirse, deja de contar en el badge.
      refreshUnseenCount();
      
      // Si la orden llegó a COMPLETED, invalidar también el cache de completadas
      if (data.newStatus === ARCHIVE_STATUS) {
        queryClient.invalidateQueries({
          queryKey: [...ORDERS_KEYS.all, businessId, 'completed'],
        });
      }
    });

    socket.on(WS_EVENTS.ORDER_CUSTOMER_EDIT, (data: OrderCustomerEditEvent) => {
      // Cambian el bloqueo y, al reconfirmar o restaurar, los productos y el
      // total: se refetchea el pedido y el tablero en vez de parchear el cache.
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(data.orderId) });
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'live'],
      });
    });

    // Sin esto el ícono del comprobante (y su color de confianza) recién
    // aparecía al recargar la página. El detalle invalida también el
    // comprobante y su análisis, que cuelgan de la misma key.
    const refreshPaymentProof = (data: OrderPaymentProofEvent) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(data.orderId) });
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'live'],
      });
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, 'completed'],
      });
    };
    socket.on(WS_EVENTS.ORDER_PAYMENT_PROOF, refreshPaymentProof);
    socket.on(WS_EVENTS.ORDER_PAYMENT_VERIFICATION, refreshPaymentProof);

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

    // Caja (docs/caja-pedidos.md): turno o recaudo cambió en el negocio —
    // se invalida toda la caché de caja y el tablero de pedidos (el chip
    // "Por liquidar" y el tab "Por cobrar" dependen de ambos).
    // Viaja por el mismo namespace `/orders`, sin segundo socket.
    // "Por cobrar" de Caja sale de los pedidos: cambia cuando entra uno,
    // cambia de estado o se paga.
    const refreshReceivables = () => {
      queryClient.invalidateQueries({ queryKey: ["cash", "receivables"] });
    };
    socket.on(WS_EVENTS.ORDER_CREATED, refreshReceivables);
    socket.on(WS_EVENTS.ORDER_UPDATED, refreshReceivables);
    socket.on(WS_EVENTS.ORDER_PAYMENT_UPDATED, refreshReceivables);

    const refreshCash = () => {
      queryClient.invalidateQueries({ queryKey: ["cash"] });
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_KEYS.all, businessId, "live"],
      });
    };
    socket.on(WS_EVENTS.CASH_SESSION_UPDATED, refreshCash);
    socket.on(WS_EVENTS.CASH_COLLECTION_UPDATED, refreshCash);

    socket.on(WS_EVENTS.OPERATOR_JOINED, ({ userId }: OperatorEvent) => {
      debugLog('[WS] Operador conectado:', userId);
    });

    socket.on(WS_EVENTS.OPERATOR_LEFT, ({ userId }: OperatorEvent) => {
      debugLog('[WS] Operador desconectado:', userId);
    });

    return () => {
      reconnector.stop();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setState({ isConnected: false, isConnecting: false, error: null });
    };
  }, [enabled, businessId, getToken, queryClient, refreshAndReconnect]);

  return state;
}
