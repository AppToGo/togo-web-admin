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
}

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

/**
 * Horario por defecto para un día (cerrado)
 */
export const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  isOpen: false,
  open: "09:00",
  close: "18:00",
};

/**
 * Horarios por defecto (todos los días cerrados)
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  timezone: "America/Bogota",
  schedule: {
    monday: { ...DEFAULT_DAY_SCHEDULE },
    tuesday: { ...DEFAULT_DAY_SCHEDULE },
    wednesday: { ...DEFAULT_DAY_SCHEDULE },
    thursday: { ...DEFAULT_DAY_SCHEDULE },
    friday: { ...DEFAULT_DAY_SCHEDULE },
    saturday: { ...DEFAULT_DAY_SCHEDULE, isOpen: false },
    sunday: { ...DEFAULT_DAY_SCHEDULE, isOpen: false },
  },
  holidays: [],
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
  businessHours: DEFAULT_BUSINESS_HOURS,
};
