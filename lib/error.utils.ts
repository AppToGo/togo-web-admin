/**
 * Utilidades para extraer mensajes de error amigables
 */

/**
 * Extrae un mensaje de error legible de cualquier tipo de error
 * 
 * @param err - El error de cualquier tipo (Axios, Error, string, etc)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno mejor
 * @returns Mensaje de error amigable para mostrar al usuario
 */
export function extractErrorMessage(err: unknown, defaultMessage: string): string {
  // Si es un Error estándar y no es el mensaje genérico de Axios
  if (err instanceof Error) {
    const msg = err.message;
    // Evitar mensajes técnicos de Axios
    if (!msg.includes("Request failed with status code") && 
        !msg.includes("Network Error") &&
        msg.length > 0) {
      return msg;
    }
  }
  
  // Intentar extraer de Axios error response
  const axiosError = err as any;
  if (axiosError.response?.data) {
    const data = axiosError.response.data;
    // Buscar en diferentes propiedades comunes del backend
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.errors?.[0]?.message) return data.errors[0].message;
    if (typeof data === "string" && data.length > 0) return data;
  }
  
  // Intentar extraer del error de Axios directamente
  if (axiosError.message && typeof axiosError.message === "string") {
    const msg = axiosError.message;
    if (!msg.includes("Request failed with status code")) {
      return msg;
    }
  }
  
  return defaultMessage;
}

/**
 * Mensajes de error comunes mapeados a mensajes amigables
 */
export const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  "Invalid payment status transition": "No se puede cambiar el estado de pago de esta manera",
  "Cannot complete order": "No se puede completar la orden",
  "Order not found": "Orden no encontrada",
  "Unauthorized": "No tienes permisos para realizar esta acción",
  "Forbidden": "Acceso denegado",
  "Bad Request": "Solicitud inválida",
  "Network Error": "Error de conexión. Verifica tu internet",
  "Timeout": "La operación tardó demasiado. Intenta de nuevo",
};

/**
 * Obtiene un mensaje amigable basado en el tipo de error conocido
 */
export function getFriendlyErrorMessage(err: unknown, defaultMessage: string): string {
  const message = extractErrorMessage(err, defaultMessage);
  
  // Buscar si el mensaje contiene alguna clave conocida
  for (const [key, friendlyMessage] of Object.entries(FRIENDLY_ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  return message;
}
