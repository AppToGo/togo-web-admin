/**
 * Hybrid Catalog Types
 * 
 * Tipos extendidos para el enfoque HYBRID de inventario por sede.
 * Estos tipos representan la disponibilidad de productos por sede.
 */

import type { BusinessProduct } from "./catalog.types";

/**
 * Representa la disponibilidad de un producto en una sede específica
 */
export interface BranchAvailability {
  branchId: string;
  branchName: string;
  branchCode: string;
  isAvailable: boolean;
  stock: number | null;
  priceOverride: number | null;
  effectivePrice: number;
}

/**
 * Producto extendido con información de disponibilidad por sede
 */
export interface BusinessProductWithAvailability extends BusinessProduct {
  branchAvailability?: BranchAvailability[];
}

/**
 * Filtros para productos con filtro de sede
 */
export interface ProductWithBranchFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFromTemplate?: boolean;
  page?: number;
  limit?: number;
  // Nuevos filtros HYBRID
  branchId?: string;
  activationStatus?: "activated" | "not_activated" | "all";
}

/**
 * DTO para bulk update de productos en una sede
 */
export interface BulkBranchUpdateDto {
  productIds: string[];
  branchId: string;
  isAvailable: boolean;
  stock?: number;
  priceOverride?: number;
}

/**
 * Respuesta paginada de productos con estado de activación en sede
 */
export interface PaginatedProductsWithBranchStatus {
  items: BusinessProductWithBranchInfo[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Producto con información de activación en sede específica
 */
export interface BusinessProductWithBranchInfo extends BusinessProduct {
  branchInfo?: {
    isAvailable: boolean;
    isAvailable: boolean;
    stock: number | null;
    priceOverride: number | null;
    effectivePrice: number;
  };
}

/**
 * Props para filtros de productos con selección de sede
 */
export interface ProductFiltersWithBranchProps {
  selectedBranchId: string | null;
  onBranchChange: (branchId: string | null) => void;
  activationStatus: "activated" | "not_activated" | "all";
  onActivationStatusChange: (status: "activated" | "not_activated" | "all") => void;
  branches: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  showBranchFilter: boolean;
}
