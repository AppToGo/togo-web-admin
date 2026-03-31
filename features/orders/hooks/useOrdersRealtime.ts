'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useBusinessStore } from '@/features/business/stores/business.store';
import { APP_CONFIG } from '@/config/app.config';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ORDERS_KEYS } from './useOrders';
import { formatOrderNumber } from '@/features/orders/utils/order-number.utils';
import { useNotificationPreferences } from '@/features/notifications/stores/notification-preferences.store';

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

// Simple beep sound as base64 fallback (short notification chime)
const NOTIFICATION_SOUND_BASE64 =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSA0PVanu8LdnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREP';

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
  const isRefreshingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = useTranslations('orders');

  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();
  const businessId = selectedBusinessId || user?.businessId || null;
  
  // Get notification preferences from store
  const { enableSounds, enableNotifications } = useNotificationPreferences();

  const getToken = useCallback(() => useAuthStore.getState().accessToken, []);

  // Initialize audio element for notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_BASE64);
      audioRef.current.volume = 0.5;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound with browser autoplay policy handling
  const playNotificationSound = useCallback(async () => {
    if (!enableSounds || !audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      // Browser autoplay policy blocked the sound - this is expected
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('[WS] Sound play prevented by browser policy:', error);
      }
    }
  }, [enableSounds]);

  const refreshAndReconnect = useCallback(
    async (socket: Socket) => {
      // Lock para evitar múltiples refreshs paralelos
      if (isRefreshingRef.current) return;

      isRefreshingRef.current = true;
      try {
        const refreshed = await useAuthStore.getState().refreshAccessToken();
        if (refreshed) {
          const newToken = useAuthStore.getState().accessToken;
          socket.auth = { token: newToken, businessId };
          socket.connect();
        } else {
          socket.disconnect();
        }
      } finally {
        isRefreshingRef.current = false;
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
    if (!APP_CONFIG.features.enableWebSockets || !businessId || !getToken()) {
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
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
      
      // Play sound if enabled
      playNotificationSound();
      
      // Show toast if notifications enabled
      if (enableNotifications) {
        const orderNumber = formatOrderNumber(data.orderId);
        toast.info(t('notifications.newOrder', { orderNumber }));
      }
    });

    socket.on(WS_EVENTS.ORDER_UPDATED, (data: OrderUpdatedEvent) => {
      queryClient.setQueryData(ORDERS_KEYS.detail(data.orderId), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, status: data.newStatus, updatedAt: data.timestamp };
      });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
    });

    socket.on(WS_EVENTS.ORDER_PAYMENT_UPDATED, (data: OrderPaymentUpdatedEvent) => {
      queryClient.setQueryData(ORDERS_KEYS.detail(data.orderId), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, paymentStatus: data.newStatus, updatedAt: data.timestamp };
      });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
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
  }, [businessId, getToken, queryClient, refreshAndReconnect, playNotificationSound, enableNotifications, t]);

  return state;
}
