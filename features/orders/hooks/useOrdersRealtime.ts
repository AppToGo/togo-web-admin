import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useBusinessStore } from '@/features/business/stores/business.store';
import { APP_CONFIG } from '@/config/app.config';
import { toast } from 'sonner';
import { ORDERS_KEYS } from './useOrders';

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/v1', '');

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

  const getToken = useCallback(() => useAuthStore.getState().accessToken, []);

  const refreshAndReconnect = useCallback(async (socket: Socket) => {
    const refreshed = await useAuthStore.getState().refreshAccessToken();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      socket.auth = { token: newToken };
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, []);

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

    const socket = io(`${WS_URL}/orders`, {
      auth: { token: getToken() },
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

    socket.on('auth_error', async ({ message }: { message: string }) => {
      if (message === 'token_expired') {
        await refreshAndReconnect(socket);
      }
    });

    socket.on('order:created', (data) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
      toast.info(`Nueva orden #${data.orderId.slice(-6)}`);
    });

    socket.on('order:updated', (data) => {
      queryClient.setQueryData(ORDERS_KEYS.detail(data.orderId), (old: any) => {
        if (!old) return old;
        return { ...old, status: data.newStatus, updatedAt: data.timestamp };
      });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
    });

    socket.on('order:paymentUpdated', (data) => {
      queryClient.setQueryData(ORDERS_KEYS.detail(data.orderId), (old: any) => {
        if (!old) return old;
        return { ...old, paymentStatus: data.newStatus, updatedAt: data.timestamp };
      });
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() });
    });

    socket.on('operator:joined', ({ userId }) => {
      console.debug('[WS] Operador conectado:', userId);
    });

    socket.on('operator:left', ({ userId }) => {
      console.debug('[WS] Operador desconectado:', userId);
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
