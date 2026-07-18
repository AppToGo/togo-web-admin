'use client';

import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { UserRole } from '@/types';

export function useBranchPermissions() {
  const user = useCurrentUser();
  
  const canEditBranches = user?.role === UserRole.OWNER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;
  const canCreateBranches = user?.role === UserRole.OWNER || user?.role === UserRole.SUPER_ADMIN;
  const canDeleteBranches = user?.role === UserRole.OWNER || user?.role === UserRole.SUPER_ADMIN;
  
  return {
    canEditBranches,
    canCreateBranches,
    canDeleteBranches,
  };
}
