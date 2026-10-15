'use client';

import { useTranslations } from 'next-intl';
import { useDateFilterPreset } from '@/features/filters/stores/date-filter.store';

/** Nombre del período elegido en el filtro de fechas ("Este mes", "Hoy"…). */
export function usePeriodLabel(): string {
  const t = useTranslations('dashboard.periods');
  return t(useDateFilterPreset());
}
