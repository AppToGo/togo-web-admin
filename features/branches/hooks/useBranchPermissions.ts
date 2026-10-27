'use client';

import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { UserRole } from '@/types';
import { isPlatformStaffRole } from "@/lib/auth/platform-staff";

export function useBranchPermissions() {
  const user = useCurrentUser();
  
  const canEditBranches = user?.role === UserRole.OWNER || isPlatformStaffRole(user?.role) || user?.role === UserRole.ADMIN;
  const canCreateBranches = user?.role === UserRole.OWNER || isPlatformStaffRole(user?.role);
  const canDeleteBranches = user?.role === UserRole.OWNER || isPlatformStaffRole(user?.role);
  
  return {
    canEditBranches,
    canCreateBranches,
    canDeleteBranches,
  };
}
