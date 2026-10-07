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

// Lee la marca y escribe `now` si está vencida. Puede lanzar si localStorage
// no está disponible (modo privado, bloqueado).
function checkAndSetClaim(storageKey: string, now: number): boolean {
  const last = Number(localStorage.getItem(storageKey));
  if (last && now - last < DEDUPE_WINDOW_MS) return false;
  localStorage.setItem(storageKey, String(now));
  removeExpiredClaims(now);
  return true;
}

/**
 * Reclama el aviso `key` para esta pestaña. Si otra ya lo reclamó dentro de
 * la ventana, devuelve false. El check-and-set corre dentro de un Web Lock
 * (exclusivo por clave), así que dos pestañas que reciben el mismo evento
 * del socket al mismo tiempo no suenan las dos: el lock serializa el
 * reclamo. Sin Web Locks o sin localStorage (modo privado, bloqueado)
 * suena siempre: mejor repetido que mudo.
 */
async function claimNotification(key: string): Promise<boolean> {
  const storageKey = `${DEDUPE_STORAGE_PREFIX}${key}`;
  const now = Date.now();
  try {
    if (navigator.locks) {
      return await navigator.locks.request(storageKey, async () => {
        try {
          return checkAndSetClaim(storageKey, now);
        } catch {
          return true;
        }
      });
    }
  } catch {
    // Web Locks no disponible o rechazado: camino sin lock.
  }
  try {
    return checkAndSetClaim(storageKey, now);
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
  if (dedupeKey && !(await claimNotification(dedupeKey))) return;

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
