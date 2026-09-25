import type { Socket } from "socket.io-client";

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/**
 * Reconexión manual con backoff para sockets creados con `reconnection: false`.
 *
 * Esos sockets no reintentan solos: sin esto, un reinicio de la API (cada
 * deploy) o un corte de red deja al admin sin tiempo real hasta recargar la
 * página. Los errores de auth NO pasan por acá — los maneja el refresh de token.
 */
export function createReconnectScheduler(socket: Socket) {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return {
    schedule() {
      if (stopped || timer || socket.connected) return;
      const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
      attempt += 1;
      timer = setTimeout(() => {
        timer = null;
        if (!stopped && !socket.connected) socket.connect();
      }, delay);
    },
    reset() {
      attempt = 0;
      cancel();
    },
    stop() {
      stopped = true;
      cancel();
    },
  };
}
