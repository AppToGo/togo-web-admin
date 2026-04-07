'use client';

import { useState, useCallback } from 'react';

interface UseBranchFilterReturn {
  branchId: string | null;
  setBranchId: (id: string | null) => void;
  clearBranch: () => void;
}

/**
 * Hook para manejar el estado del filtro de sede en el dashboard
 * 
 * @returns Estado y acciones para manejar la sede seleccionada
 */
export function useBranchFilter(): UseBranchFilterReturn {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const setBranchId = useCallback((id: string | null) => {
    setSelectedBranchId(id);
  }, []);

  const clearBranch = useCallback(() => {
    setSelectedBranchId(null);
  }, []);

  return {
    branchId: selectedBranchId,
    setBranchId,
    clearBranch,
  };
}
