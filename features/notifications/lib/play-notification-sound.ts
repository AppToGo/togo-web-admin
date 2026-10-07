// Archivo del sonido de notificación
const SOUND_PATH = "/sounds/beep.mp3";

// Con el admin abierto en varias pestañas, cada una recibe el mismo evento
// del socket. La primera que reclama la clave suena; las demás callan
// durante esta ventana.
const DEDUPE_WINDOW_MS = 10 * 1000;
const DEDUPE_STORAGE_PREFIX = "togo-notification-sound:";

// Una clave por pedido o conversación: se limpian las vencidas para que no
// se acumulen en localStorage.
function removeExpiredClaims(now: number): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(DEDUPE_STORAGE_PREFIX)) continue;
    if (now - Number(localStorage.getItem(key)) >= DEDUPE_WINDOW_MS) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Reclama el aviso `key` para esta pestaña. Si otra ya lo reclamó dentro de
 * la ventana, devuelve false. Sin localStorage (modo privado, bloqueado)
 * suena siempre: mejor repetido que mudo.
 */
function claimNotification(key: string): boolean {
  try {
    const storageKey = `${DEDUPE_STORAGE_PREFIX}${key}`;
    const now = Date.now();
    const last = Number(localStorage.getItem(storageKey));
    if (last && now - last < DEDUPE_WINDOW_MS) return false;
    localStorage.setItem(storageKey, String(now));
    removeExpiredClaims(now);
    return true;
  } catch {
    return true;
  }
}

/**
 * Reproduce el sonido de notificación (pedido nuevo, cliente que pide asesor).
 * Crea un Audio nuevo cada vez para que suene de forma confiable e ignora el
 * bloqueo de autoplay del navegador (esperable antes de que el usuario
 * interactúe con la página). Con `dedupeKey` suena una sola vez aunque el
 * admin esté abierto en varias pestañas.
 */
export async function playNotificationSound(dedupeKey?: string): Promise<void> {
  if (dedupeKey && !claimNotification(dedupeKey)) return;

  try {
    const audio = new Audio(SOUND_PATH);
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[Notification] Sound play prevented:", error);
    }
  }
}
