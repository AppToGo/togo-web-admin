'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { BusinessHours, DaySchedule } from '../types';

interface BusinessHoursSectionProps {
  value: BusinessHours | undefined;
  onChange: (hours: BusinessHours) => void;
}

const DAYS = [
  { key: 'monday', labelKey: 'monday' },
  { key: 'tuesday', labelKey: 'tuesday' },
  { key: 'wednesday', labelKey: 'wednesday' },
  { key: 'thursday', labelKey: 'thursday' },
  { key: 'friday', labelKey: 'friday' },
  { key: 'saturday', labelKey: 'saturday' },
  { key: 'sunday', labelKey: 'sunday' },
] as const;

type DayKey = typeof DAYS[number]['key'];

const DEFAULT_SCHEDULE: BusinessHours = {
  timezone: 'America/Bogota',
  schedule: {
    monday: { isOpen: true, open: '09:00', close: '18:00' },
    tuesday: { isOpen: true, open: '09:00', close: '18:00' },
    wednesday: { isOpen: true, open: '09:00', close: '18:00' },
    thursday: { isOpen: true, open: '09:00', close: '18:00' },
    friday: { isOpen: true, open: '09:00', close: '18:00' },
    saturday: { isOpen: false, open: '09:00', close: '18:00' },
    sunday: { isOpen: false, open: '09:00', close: '18:00' },
  },
  holidays: [],
};

export function BusinessHoursSection({ value, onChange }: BusinessHoursSectionProps) {
  const t = useTranslations('branches.settings.businessHours');
  const hours: BusinessHours = {
    ...DEFAULT_SCHEDULE,
    ...value,
    schedule: {
      ...DEFAULT_SCHEDULE.schedule,
      ...(value?.schedule ?? {}),
    },
  };

  const handleDayToggle = (day: DayKey, isOpen: boolean) => {
    onChange({
      ...hours,
      schedule: {
        ...hours.schedule,
        [day]: {
          ...hours.schedule[day],
          isOpen,
        },
      },
    });
  };

  const handleTimeChange = (day: DayKey, field: 'open' | 'close', time: string) => {
    onChange({
      ...hours,
      schedule: {
        ...hours.schedule,
        [day]: {
          ...hours.schedule[day],
          [field]: time,
        },
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona horaria */}
        <div className="space-y-2">
          <Label htmlFor="timezone">{t('timezone')}</Label>
          <Input
            id="timezone"
            value={hours.timezone}
            onChange={(e) => onChange({ ...hours, timezone: e.target.value })}
            placeholder="America/Bogota"
          />
        </div>

        {/* Horarios por día */}
        <div className="space-y-4">
          {DAYS.map(({ key, labelKey }) => {
            const daySchedule = hours.schedule[key];
            return (
              <div
                key={key}
                className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
              >
                <Checkbox
                  id={`${key}-open`}
                  checked={daySchedule.isOpen}
                  onCheckedChange={(checked) =>
                    handleDayToggle(key, checked === true)
                  }
                />
                <Label
                  htmlFor={`${key}-open`}
                  className="w-24 font-medium cursor-pointer"
                >
                  {t(`days.${labelKey}`)}
                </Label>
                
                {daySchedule.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={daySchedule.open}
                      onChange={(e) =>
                        handleTimeChange(key, 'open', e.target.value)
                      }
                      className="w-28"
                    />
                    <span className="text-slate-400">-</span>
                    <Input
                      type="time"
                      value={daySchedule.close}
                      onChange={(e) =>
                        handleTimeChange(key, 'close', e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 flex-1">
                    {t('closed')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
