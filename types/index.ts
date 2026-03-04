/**
 * Core Type Definitions
 * 
 * Shared types used across the application
 */

// User roles matching backend
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
  MESERO = "MESERO",
  DELIVERY = "DELIVERY",
}

// Base API response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

// API Error
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Tenant (Business)
export interface Business {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Common entity timestamps
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}
