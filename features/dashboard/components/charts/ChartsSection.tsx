'use client';

import { useMyPermissions } from '@/features/auth/hooks/useMyPermissions';
import { cn } from '@/lib/utils';
import { BotConversationsCard } from './BotConversationsCard';
import { OrderStatusCard } from './OrderStatusCard';
import { PeakHours } from './PeakHours';

export function ChartsSection() {
  const { hasPermission } = useMyPermissions();
  // Mismo permiso que el endpoint del embudo del bot y su entrada del Sidebar.
  const canViewBotFunnel = hasPermission('metrics.view');

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        canViewBotFunnel ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
      )}
    >
      <OrderStatusCard />
      {canViewBotFunnel && <BotConversationsCard />}
      <PeakHours />
    </div>
  );
}
