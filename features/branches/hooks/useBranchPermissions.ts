'use client';

import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { UserRole } from '@/types';
import { isPlatformStaffRole } from "@/lib/auth/platform-staff";
import { usePlatformPermission } from "@/features/auth/hooks/usePlatformPermission";

export function useBranchPermissions() {
  const user = useCurrentUser();
  // Personal de ToGo: el SUPER_ADMIN siempre; un usuario interno solo si su
  // perfil le permite operar negocios (con solo lectura el backend responde 403)
  const { allowed: canOperate } = usePlatformPermission("platform.business.operate");
  const isStaffOperator = isPlatformStaffRole(user?.role) && canOperate;

  const canEditBranches = user?.role === UserRole.OWNER || isStaffOperator || user?.role === UserRole.ADMIN;
  const canCreateBranches = user?.role === UserRole.OWNER || isStaffOperator;
  const canDeleteBranches = user?.role === UserRole.OWNER || isStaffOperator;
  
  return {
    canEditBranches,
    canCreateBranches,
    canDeleteBranches,
  };
}
