/**
 * User Types
 *
 * Type definitions for user management
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  businessId: string | null;
  operatorProfileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  operatorProfileId?: string | null;
}
