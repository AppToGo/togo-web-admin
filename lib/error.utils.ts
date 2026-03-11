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
 * Mensajes de error comunes mapeados a mensajes amigables para el usuario
 * Las claves son patrones que se buscan en el mensaje de error (case-insensitive)
 */
export const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  // Errores de órdenes
  "Order not found": "No pudimos encontrar esta orden. Por favor, verifica e intenta de nuevo.",
  "Cannot complete order": "No se puede completar la orden",
  "Invalid status transition": "No se puede cambiar a este estado desde el estado actual.",
  
  // Errores de transición de estado
  "Cannot transition from": "No se puede cambiar a este estado desde el estado actual.",
  "Cannot transition": "No se puede cambiar a este estado desde el estado actual.",
  
  // Errores de stock/pagos
  "Insufficient stock": "No hay suficiente stock disponible para este producto.",
  "Payment failed": "El pago no pudo ser procesado. Intenta con otro método.",
  "Invalid payment status transition": "No se puede cambiar el estado de pago de esta manera",
  
  // Errores de permisos
  "Unauthorized": "No tienes permisos para realizar esta acción.",
  "Forbidden": "Acceso denegado",
  
  // Errores de red/servidor
  "Network Error": "Hubo un problema de conexión. Verifica tu internet e intenta de nuevo.",
  "Timeout": "La operación tardó demasiado. Intenta de nuevo",
  "Bad Request": "Solicitud inválida",
  "Request failed": "No pudimos completar la acción. Intenta de nuevo más tarde.",
  
  // Errores genéricos
  "Internal server error": "Ocurrió un error en el servidor. Por favor, intenta más tarde.",
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

/**
 * Obtiene un mensaje de error humanizado/amigable para mostrar en toasts
 * Función específica para useMutationWithToast
 * 
 * @param error - El error de cualquier tipo
 * @returns Mensaje humanizado listo para mostrar al usuario
 */
export function getHumanizedErrorMessage(error: unknown): string {
  const defaultMessage = "Ha ocurrido un error. Por favor, intenta de nuevo.";
  
  // Si no hay error, retornar mensaje por defecto
  if (!error) return defaultMessage;
  
  // Extraer mensaje del error - PRIORIZAR mensaje del backend ( Axios response.data.message )
  let rawMessage = "";
  
  // Primero intentar obtener el mensaje del backend (Axios error response)
  const axiosError = error as any;
  if (axiosError.response?.data?.message) {
    rawMessage = axiosError.response.data.message;
  } else if (axiosError.response?.data?.error) {
    rawMessage = axiosError.response.data.error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "string") {
    rawMessage = error;
  } else if (axiosError.message) {
    rawMessage = axiosError.message;
  }
  
  // Buscar coincidencia con mensajes conocidos (case-insensitive, búsqueda parcial)
  const lowerRawMessage = rawMessage.toLowerCase();
  for (const [key, friendlyMessage] of Object.entries(FRIENDLY_ERROR_MESSAGES)) {
    if (lowerRawMessage.includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  // Si no hay coincidencia, retornar el mensaje original si es válido
  // o el mensaje por defecto si es un mensaje técnico genérico
  if (rawMessage && 
      !rawMessage.includes("Request failed with status code") &&
      rawMessage.length < 200) {
    return rawMessage;
  }
  
  return defaultMessage;
}
