'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Headset, MessagesSquare } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/features/auth/stores/auth.store';
import { useDateFilterRange } from '@/features/filters/stores/date-filter.store';
import { useConversationFunnel } from '@/features/conversations/hooks/useConversationFunnel';
import { formatRate } from '@/features/conversations/components/conversation-funnel/funnel-format';
import { useDashboardBranchId } from '../../stores/branch-filter.store';
import { CardSkeleton } from '../loading/CardSkeleton';
import { DashboardCardHeader } from '../DashboardCardHeader';
import { SegmentedBreakdown } from './SegmentedBreakdown';

/**
 * Resumen del embudo del bot (conversación → pedido) con el mismo período
 * del dashboard. El detalle completo vive en /dashboard/conversation-funnel;
 * quien muestra esta tarjeta ya validó el permiso `metrics.view`.
 */
export function BotConversationsCard() {
  const t = useTranslations('dashboard.charts.botConversations');
  const range = useDateFilterRange();
  const branchId = useDashboardBranchId();
  // Mismo negocio que los KPIs y las demás tarjetas, no el del selector de
  // SUPER_ADMIN: si no, la tarjeta podría mostrar otro negocio.
  const businessId = useCurrentUser()?.businessId ?? undefined;
  const { data, isLoading, isError } = useConversationFunnel(
    { dateFrom: range.from, dateTo: range.to },
    { businessId },
  );

  if (isLoading) return <CardSkeleton className="h-80" />;

  const sessions = data?.sessions;
  const outcome = (key: string) => sessions?.byOutcome[key] ?? 0;
  const known = outcome('ORDER_PLACED') + outcome('OPEN') + outcome('ABANDONED');
  const segments = [
    {
      key: 'ORDER_PLACED',
      label: t('withOrder'),
      count: outcome('ORDER_PLACED'),
      colorClass: 'bg-emerald-500',
    },
    {
      key: 'OPEN',
      label: t('open'),
      count: outcome('OPEN'),
      colorClass: 'bg-indigo-400',
    },
    {
      key: 'ABANDONED',
      label: t('abandoned'),
      count: outcome('ABANDONED'),
      colorClass: 'bg-amber-400',
    },
    {
      // Todo lo demás (soporte, sin intención, spam y cualquier resultado
      // nuevo del backend), para que la barra siempre sume el total.
      key: 'OTHER',
      label: t('other'),
      count: Math.max((sessions?.total ?? 0) - known, 0),
      colorClass: 'bg-slate-300',
    },
  ];

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <DashboardCardHeader
        icon={MessagesSquare}
        title={t('title')}
        subtitle={
          sessions ? t('subtitle', { total: sessions.total }) : undefined
        }
      />
      <CardContent className="flex flex-1 flex-col gap-4">
        {!businessId ? (
          <p className="text-sm text-slate-500">{t('noBusiness')}</p>
        ) : isError || !sessions ? (
          <p className="text-sm text-slate-500">{t('error')}</p>
        ) : sessions.total === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          <>
            <SegmentedBreakdown
              segments={segments}
              total={sessions.total}
              ariaLabel={segments
                .map((segment) => `${segment.label}: ${segment.count}`)
                .join(', ')}
            />
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Headset className="h-4 w-4 shrink-0 text-slate-500" />
              {t('handoff', { rate: formatRate(sessions.rates.handoff) })}
            </p>
          </>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          {/* El embudo del bot es por negocio: no filtra por sede. */}
          {branchId ? (
            <span className="text-xs text-slate-500">{t('allBranches')}</span>
          ) : (
            <span />
          )}
          <Link
            href="/dashboard/conversation-funnel"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t('viewMore')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
