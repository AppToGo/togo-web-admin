// Archivo del sonido de notificación
const SOUND_PATH = "/sounds/beep.mp3";

/**
 * Reproduce el sonido de notificación (pedido nuevo, cliente que pide asesor).
 * Crea un Audio nuevo cada vez para que suene de forma confiable e ignora el
 * bloqueo de autoplay del navegador (esperable antes de que el usuario
 * interactúe con la página).
 */
export async function playNotificationSound(): Promise<void> {
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
