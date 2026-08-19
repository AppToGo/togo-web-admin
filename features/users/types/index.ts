/**
 * User Types
 *
 * Type definitions for user management
 */

export interface User {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: string;
  active: boolean;
  businessId: string | null;
  operatorProfileId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Crear operador (usuario) — alineado a api-togo/src/user/dto/create-user.dto.ts
 * phoneNumber es requerido y validado contra /^\+?(57\d{10}|1\d{10})$/
 * role debe ser OPERATOR para operadores (BUSINESS_OWNER/ADMIN se gestionan aparte)
 */
export interface CreateUserRequest {
  name: string;
  phoneNumber: string;
  role: string;
  email?: string;
  password?: string;
  /** Perfil de operador a asignar post-creación (se asigna vía PATCH /users/:id) */
  operatorProfileId?: string | null;
}

export interface UpdateUserRequest {
  name?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  active?: boolean;
  operatorProfileId?: string | null;
}
