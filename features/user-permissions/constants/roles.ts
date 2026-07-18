/**
 * User Role Constants
 *
 * Centralized constants for user roles to avoid hardcoded strings
 * throughout the codebase.
 */

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
} as const;

export const BRANCH_ROLES = {
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  BRANCH_OPERATOR: 'BRANCH_OPERATOR',
  BRANCH_VIEWER: 'BRANCH_VIEWER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type BranchRole = typeof BRANCH_ROLES[keyof typeof BRANCH_ROLES];
