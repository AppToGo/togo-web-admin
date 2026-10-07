'use client';

import { useTranslations } from 'next-intl';
import { Building2, Store, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffectiveBranches } from '@/features/branches/hooks';
import {
  useBranchFilterStore,
  useDashboardBranchId,
} from '../stores/branch-filter.store';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export interface BranchSelectorProps {
  className?: string;
}

/**
 * Branch Selector Component
 *
 * Selector de sucursales para el dashboard.
 * - Muestra "Todas las sedes" cuando no hay selección
 * - Usa el hook useEffectiveBranches para centralizar la lógica
 * - Integrado con el sistema de métricas del dashboard mediante store global
 */
export function BranchSelector({ className }: BranchSelectorProps) {
  const t = useTranslations('dashboard');
  const tb = useTranslations('branches');
  
  // Obtener estado y acciones del store global
  const selectedBranchId = useDashboardBranchId();
  const setSelectedBranch = useBranchFilterStore((state) => state.setSelectedBranch);

  // Usar hook centralizado para obtener sucursales efectivas
  const { 
    branches, 
    isLoading, 
    error,
    showBranchSelector,
  } = useEffectiveBranches();

  // Obtener el nombre de la sucursal seleccionada
  const selectedBranchName = (() => {
    if (!selectedBranchId) return t('filters.allBranches');
    const branch = branches.find((b) => b.id === selectedBranchId);
    return branch?.name || t('filters.allBranches');
  })();

  // Verificar si está seleccionada una sucursal específica
  const hasSelection = selectedBranchId !== null;

  // No renderizar si no debe mostrarse el selector (solo 1 sucursal o cargando permisos)
  if (!showBranchSelector && !isLoading) return null;

  // Estado de carga
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center h-10 px-3 gap-2 rounded-md border border-slate-200 bg-slate-50 min-w-45',
          className
        )}
      >
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        <Skeleton className="w-24 h-4 rounded" />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm',
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{tb('errors.loadFailed')}</span>
      </div>
    );
  }

  // Sin sucursales disponibles
  if (branches.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-sm',
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{t('filters.noBranches')}</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center h-10 px-3 gap-2 rounded-md border transition-colors min-w-45 text-left',
            hasSelection
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
            className
          )}
        >
          <Building2 className={cn(
            'w-4 h-4 shrink-0',
            hasSelection ? 'text-indigo-600' : 'text-slate-500'
          )} />
          <span className="flex-1 truncate text-sm">{selectedBranchName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">
            {t('filters.selectBranch')}
          </span>
        </div>

        {/* Lista de opciones */}
        <div className="max-h-64 overflow-y-auto">
          {/* Opción "Todas las sedes" */}
          <button
            onClick={() => setSelectedBranch(null)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50',
              !hasSelection ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded flex items-center justify-center shrink-0',
              !hasSelection ? 'bg-indigo-100' : 'bg-slate-100'
            )}>
              <Store className={cn(
                'w-3.5 h-3.5',
                !hasSelection ? 'text-indigo-600' : 'text-slate-500'
              )} />
            </div>
            <span className="flex-1 text-left">{t('filters.allBranches')}</span>
            {!hasSelection && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
          </button>

          {/* Sucursales individuales */}
          {branches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50',
                  isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded flex items-center justify-center shrink-0',
                  isSelected ? 'bg-indigo-100' : 'bg-slate-100'
                )}>
                  <Building2 className={cn(
                    'w-3.5 h-3.5',
                    isSelected ? 'text-indigo-600' : 'text-slate-500'
                  )} />
                </div>
                <span className="flex-1 text-left truncate">{branch.name}</span>
                {branch.isMainBranch && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-200 bg-amber-50 shrink-0"
                  >
                    {tb('main')}
                  </Badge>
                )}
                {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
