/**
 * Table Feature Types
 *
 * Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1).
 * Basado en los DTOs de `api-togo/src/table/dto`.
 */

export interface RestaurantTable {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  code: string;
  capacity: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableRequest {
  name: string;
  /** Si se omite, el backend lo autogenera desde `name`. */
  code?: string;
  capacity?: number;
  sortOrder?: number;
}

export interface UpdateTableRequest {
  name?: string;
  code?: string;
  capacity?: number;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Respuesta de `DELETE /tables/:id`. Regla 7: una mesa con pedidos
 * históricos se desactiva en vez de borrarse — `deactivated: true` indica
 * cuál de los dos pasó.
 */
export interface RemoveTableResponse {
  deactivated: boolean;
}
