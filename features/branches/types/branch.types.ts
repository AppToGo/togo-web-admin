/**
 * Branch Feature Types
 *
 * Tipado estricto para toda la feature de sucursales.
 * Basado en los DTOs del backend.
 */

import type { WhatsAppNumberExtra } from "../utils/branch-helpers";
import type { DeliveryConfig, BusinessHours } from './branch-config.types';

/**
 * Modo de enrutamiento de WhatsApp para una sucursal
 */
export type RoutingMode = "DEDICATED" | "SINGLE_NUMBER";

/**
 * Información de una sucursal
 */
export interface Branch {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  code: string;
  isMainBranch: boolean;
  isActive: boolean;
  whatsappPhoneNumber: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappNumbersExtra: WhatsAppNumberExtra[] | null;
  routingMode: RoutingMode;
  address: string | null;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  /** Teléfono de contacto de la sede (diferente al WhatsApp) */
  contactPhone?: string | null;
  /** Configuración de envío */
  deliveryConfig?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
}

/**
 * Respuesta de verificación de capacidad para crear sucursales
 */
export interface CanCreateBranchResponse {
  allowed: boolean;
  current: number;
  max: number;
  remaining: number;
  upgradePlan?: string;
}

/**
 * DTO para crear una nueva sucursal
 */
export interface CreateBranchRequest {
  name: string;
  slug: string;
  code: string;
  whatsappPhoneNumber?: string;
  whatsappPhoneNumberId?: string;
  routingMode: RoutingMode;
  address?: string;
  timezone?: string;
  currency?: string;
  /** Teléfono de contacto de la sede */
  contactPhone?: string;
  /** Configuración de envío */
  deliveryConfig?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
}

/**
 * DTO para actualizar una sucursal existente
 */
export interface UpdateBranchRequest {
  name?: string;
  slug?: string;
  code?: string;
  whatsappPhoneNumber?: string;
  whatsappPhoneNumberId?: string;
  routingMode?: RoutingMode;
  address?: string;
  timezone?: string;
  currency?: string;
  isActive?: boolean;
  /** Teléfono de contacto de la sede */
  contactPhone?: string;
  /** Configuración de envío */
  deliveryConfig?: DeliveryConfig;
  /** Horarios de atención */
  businessHours?: BusinessHours;
}
