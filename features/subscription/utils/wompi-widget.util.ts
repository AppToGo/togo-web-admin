/**
 * Widget oficial de Wompi en modo tokenización (docs/cobro-suscripciones.md
 * §14 en api-togo). La tarjeta se captura en la ventana de Wompi: ninguna
 * página de ToGo ve los datos de la tarjeta. El widget devuelve un token que
 * la API convierte en fuente de pago.
 *
 * Contrato leído de https://checkout.wompi.co/widget.js: al terminar
 * ("finishtokenization") llama al callback con `{ payment_source: { token,
 * type } }`; si el dueño cierra la ventana, el callback no se llama.
 */

const WIDGET_SRC = "https://checkout.wompi.co/widget.js";

export interface WompiTokenizeResult {
  payment_source?: { token?: string; type?: string };
}

interface WompiWidgetInstance {
  open: (callback: (result: WompiTokenizeResult) => void) => void;
}

type WompiWidgetConstructor = new (config: {
  publicKey: string;
  widgetOperation: "tokenize";
}) => WompiWidgetInstance;

declare global {
  interface Window {
    WidgetCheckout?: WompiWidgetConstructor;
  }
}

let loading: Promise<WompiWidgetConstructor> | null = null;

/** Carga widget.js una sola vez por sesión del navegador. */
export function loadWompiWidget(): Promise<WompiWidgetConstructor> {
  if (window.WidgetCheckout) return Promise.resolve(window.WidgetCheckout);
  if (loading) return loading;

  loading = new Promise<WompiWidgetConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    // Ante cualquier fallo se suelta el single-flight para que el próximo
    // intento vuelva a cargar el script en vez de heredar el rechazo.
    const fail = () => {
      loading = null;
      script.remove();
      reject(new Error("No se pudo cargar la ventana de pago de Wompi"));
    };
    script.onload = () =>
      window.WidgetCheckout ? resolve(window.WidgetCheckout) : fail();
    script.onerror = fail;
    document.body.appendChild(script);
  });
  return loading;
}

/**
 * Abre el widget en modo tokenización. `onToken` se llama solo si el dueño
 * termina el flujo; si cierra la ventana no pasa nada.
 */
export async function openWompiTokenizeWidget(
  publicKey: string,
  onToken: (payment: { token: string; type: string }) => void
): Promise<void> {
  const WidgetCheckout = await loadWompiWidget();
  const widget = new WidgetCheckout({ publicKey, widgetOperation: "tokenize" });
  widget.open((result) => {
    const token = result.payment_source?.token;
    if (token) onToken({ token, type: result.payment_source?.type ?? "CARD" });
  });
}
