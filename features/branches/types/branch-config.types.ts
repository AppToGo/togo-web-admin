/**
 * Tipos de configuración de Branch
 *
 * Configuración de envío y horarios de atención por sede.
 * (Copia exacta del backend para consistencia)
 */

// ============================================================================
// TIPOS DE TARIFA DE ENVÍO
// ============================================================================

/**
 * Tipo de tarifa de envío soportado
 * - FLAT: Tarifa plana única
 * - DISTANCE: Tarifa basada en rangos de distancia
 * - FREE: Envío gratis
 */
export type DeliveryFeeType = "FLAT" | "DISTANCE" | "FREE";

/**
 * Rango de distancia para tarifas por distancia
 */
export interface DistanceRange {
  /** Kilómetro inicial (inclusive) */
  minKm: number;
  /** Kilómetro final (exclusive) */
  maxKm: number;
  /** Tarifa para este rango */
  fee: number;
}

/**
 * Configuración completa de envío
 */
export interface DeliveryConfig {
  /** Tipo de tarifa de envío */
  type: DeliveryFeeType;
  /** Tarifa plana (requerido si type = 'FLAT') */
  flatFee?: number;
  /** Rangos de distancia (requerido si type = 'DISTANCE') */
  distanceRanges?: DistanceRange[];
}

// ============================================================================
// TIPOS DE HORARIOS DE ATENCIÓN
// ============================================================================

/**
 * Horario de un día específico
 */
export interface DaySchedule {
  /** Si el día está abierto */
  isOpen: boolean;
  /** Hora de apertura en formato "HH:mm" */
  open: string;
  /** Hora de cierre en formato "HH:mm" */
  close: string;
}

/**
 * Horarios de atención completos
 */
export interface BusinessHours {
  /** Zona horaria (ej: "America/Bogota") */
  timezone: string;
  /** Horario por día de la semana */
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  /** Días festivos especiales (opcional) */
  holidays?: Array<{
    /** Fecha en formato "YYYY-MM-DD" */
    date: string;
    /** Razón del cierre (opcional) */
    reason?: string;
  }>;
}

// ============================================================================
// TRANSFER PAYMENT TYPES
// ============================================================================

export type TransferOptionType = "NEQUI" | "DAVIPLATA" | "BANK_ACCOUNT";

export interface TransferOption {
  type: TransferOptionType;
  /** Display label, e.g. "Nequi La Zona" */
  name: string;
  /** Mobile number or bank account number */
  number: string;
  /** Account holder name */
  holder: string;
  /** Optional extra info, e.g. "AHORROS - Bancolombia" */
  additionalInfo?: string;
}

export interface TransferOptions {
  enabled: boolean;
  options: TransferOption[];
}

export const DEFAULT_TRANSFER_OPTIONS: TransferOptions = {
  enabled: false,
  options: [],
};

// ============================================================================
// PEDIDOS EN MESA (docs/architecture/pedidos-en-mesa.md, Fase 1)
// ============================================================================

/**
 * Configuración de servicio a mesa de una sede.
 *
 * Invariante: el backend nunca persiste `null` acá — la columna
 * (`Branch.dineInConfig Json?`) tiene `@default("{}")`, así que lo que
 * llega de la API es siempre `{}` (sede sin configurar) o el objeto
 * completo con los 3 booleanos. `branch-form.tsx` igual castea a
 * `DineInConfig | null` al leer `branch.dineInConfig` porque el campo
 * viaja como `unknown` en el DTO del backend — es una guarda defensiva
 * por el tipo ancho del JSON, no porque el backend pueda escribir `null`
 * de verdad.
 */
export interface DineInConfig {
  /** Maestro: si es false, "mesa" no aparece en ningún canal. */
  enabled: boolean;
  /** Clientes pueden pedir para mesa por WhatsApp/catálogo web. */
  allowCustomers: boolean;
  /** Operadores pueden tomar pedidos de mesa (comando /nuevo). */
  allowOperators: boolean;
}

export const DEFAULT_DINE_IN_CONFIG: DineInConfig = {
  enabled: false,
  allowCustomers: false,
  allowOperators: false,
};

/**
 * Venta de mostrador (docs/caja-pedidos.md) — espeja
 * `CounterConfigSchema` del backend. `enabled` es el maestro: si es
 * false, el drawer "Nuevo pedido" no ofrece "Mostrador" en esa sede.
 * Sedes anteriores a la feature traen `{}` (migración con DEFAULT),
 * que se interpreta como apagado.
 */
export interface CounterConfig {
  /** Maestro: si es false, "Mostrador" no aparece en el admin. */
  enabled: boolean;
}

export const DEFAULT_COUNTER_CONFIG: CounterConfig = {
  enabled: false,
};

export function isCounterEnabled(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  return (raw as CounterConfig).enabled === true;
}

// ============================================================================
// CONFIGURACIÓN COMPLETA
// ============================================================================

/**
 * Configuración completa de una Branch
 */
export interface BranchSettings {
  /** Configuración de envío */
  delivery?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
  /** Opciones de pago por transferencia */
  transferOptions?: TransferOptions;
  /** Servicio a mesa */
  dineInConfig?: DineInConfig;
}

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

export const BUSINESS_HOURS_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof BUSINESS_HOURS_DAYS)[number];

/**
 * Horario vacío para cuando el negocio activa el horario de atención:
 * todos los días cerrados y sin horas, para que elija uno a uno los que
 * atiende. No es un valor por defecto de la sede — una sede sin horario
 * (`businessHours = {}`) acepta pedidos siempre.
 */
export const createEmptyBusinessHours = (timezone: string): BusinessHours => ({
  timezone,
  schedule: {
    monday: { isOpen: false, open: "", close: "" },
    tuesday: { isOpen: false, open: "", close: "" },
    wednesday: { isOpen: false, open: "", close: "" },
    thursday: { isOpen: false, open: "", close: "" },
    friday: { isOpen: false, open: "", close: "" },
    saturday: { isOpen: false, open: "", close: "" },
    sunday: { isOpen: false, open: "", close: "" },
  },
  holidays: [],
});

/**
 * Lee `branch.businessHours` tal como llega del API. El backend guarda `{}`
 * cuando la sede no tiene horario (StoreStatusService la trata como
 * SIN_CONFIGURAR y acepta pedidos siempre), así que solo hay horario si
 * viene `schedule`.
 */
export const parseBusinessHours = (
  raw: unknown,
  fallbackTimezone = "America/Bogota"
): BusinessHours | null => {
  const typed = raw as Partial<BusinessHours> | null | undefined;
  if (!typed?.schedule) return null;
  return {
    timezone: typed.timezone || fallbackTimezone,
    schedule: typed.schedule,
    holidays: typed.holidays ?? [],
  };
};

export type BusinessHoursDayError = "missingTimes" | "sameTimes";

export interface BusinessHoursErrors {
  /** Horario activo sin ningún día abierto */
  noOpenDays?: boolean;
  /** Error por día abierto */
  days?: Partial<Record<DayKey, BusinessHoursDayError>>;
}

/**
 * Valida un horario activo. Un cierre anterior a la apertura es válido
 * (horario nocturno, ej. 18:00–02:00).
 */
export const validateBusinessHours = (
  hours: BusinessHours
): BusinessHoursErrors | null => {
  const openDays = BUSINESS_HOURS_DAYS.filter(
    (day) => hours.schedule[day]?.isOpen
  );
  if (openDays.length === 0) return { noOpenDays: true };

  const days: Partial<Record<DayKey, BusinessHoursDayError>> = {};
  for (const day of openDays) {
    const { open, close } = hours.schedule[day];
    if (!open || !close) days[day] = "missingTimes";
    else if (open === close) days[day] = "sameTimes";
  }
  return Object.keys(days).length > 0 ? { days } : null;
};

/**
 * Configuración de envío por defecto (gratis)
 */
export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  type: "FREE",
};

/**
 * Configuración completa por defecto
 */
export const DEFAULT_BRANCH_SETTINGS: BranchSettings = {
  delivery: DEFAULT_DELIVERY_CONFIG,
};
