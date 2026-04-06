'use client';

import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BusinessFormData } from '../types/business-settings.types';

interface WorkingHoursFieldProps {
  value: BusinessFormData['workingHours'];
  onChange: (value: BusinessFormData['workingHours']) => void;
  disabled?: boolean;
}

type DayKey = keyof BusinessFormData['workingHours'];

const DAYS_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function WorkingHoursField({ value, onChange, disabled }: WorkingHoursFieldProps) {
  const t = useTranslations('businessSettings');

  const handleToggleDay = (day: DayKey) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        enabled: !value[day].enabled,
      },
    });
  };

  const handleTimeChange = (day: DayKey, field: 'open' | 'close', timeValue: string) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: timeValue,
      },
    });
  };

  return (
    <div className="space-y-4">
      {DAYS_ORDER.map((day) => (
        <div
          key={day}
          className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 bg-white"
        >
          <div className="w-28">
            <span className="text-sm font-medium text-slate-700">
              {t(`workingHours.${day}`)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={value[day].enabled}
              onCheckedChange={() => handleToggleDay(day)}
              disabled={disabled}
            />
            <span className="text-sm text-slate-600">
              {value[day].enabled ? t('workingHours.enabled') : t('workingHours.closed')}
            </span>
          </div>

          {value[day].enabled && (
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">{t('workingHours.open')}</Label>
                <Input
                  type="time"
                  value={value[day].open}
                  onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                  disabled={disabled}
                  className="w-28"
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">{t('workingHours.close')}</Label>
                <Input
                  type="time"
                  value={value[day].close}
                  onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                  disabled={disabled}
                  className="w-28"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
