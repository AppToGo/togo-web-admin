'use client';

import { useMyPermissions } from '@/features/auth/hooks/useMyPermissions';
import { cn } from '@/lib/utils';
import { CardSkeleton } from '../loading/CardSkeleton';
import { BotConversationsCard } from './BotConversationsCard';
import { OrderStatusCard } from './OrderStatusCard';
import { PeakHours } from './PeakHours';

/**
 * Siempre 3 columnas, igual que `ChartsSectionSkeleton`: sin el permiso del
 * bot, Horas pico ocupa dos. Así el grid no cambia mientras cargan los
 * permisos ni al resolverse.
 */
export function ChartsSection() {
  const { hasPermission, isLoading } = useMyPermissions();
  // Mismo permiso que el endpoint del embudo del bot y su entrada del Sidebar.
  const canViewBotFunnel = hasPermission('metrics.view');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <OrderStatusCard />
      {isLoading ? (
        <CardSkeleton className="h-80" />
      ) : (
        canViewBotFunnel && <BotConversationsCard />
      )}
      <div className={cn(!isLoading && !canViewBotFunnel && 'lg:col-span-2')}>
        <PeakHours />
      </div>
    </div>
  );
}
