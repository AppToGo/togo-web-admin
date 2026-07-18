'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Store, Phone } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { DeliveryConfigSection } from './DeliveryConfigSection';
import { BusinessHoursSection } from './BusinessHoursSection';
import { TransferOptionsSection } from './TransferOptionsSection';
import type { Branch, DeliveryConfig, BusinessHours, TransferOptions } from '../types';
import { DEFAULT_TRANSFER_OPTIONS } from '../types';

interface BranchSettingsFormProps {
  /** Sede a configurar */
  branch: Branch;
  /** Callback al guardar */
  onSave: (data: BranchSettingsFormData) => Promise<void>;
  /** Si está guardando */
  isSaving?: boolean;
  /** Modo de visualización */
  mode?: 'PAGE' | 'INLINE';
  /** URL para volver (solo en modo PAGE) */
  backUrl?: string;
  /** Callback para cancelar (solo en modo INLINE) */
  onCancel?: () => void;
}

export interface BranchSettingsFormData {
  name: string;
  contactPhone: string;
  address: string;
  deliveryConfig?: DeliveryConfig;
  businessHours?: BusinessHours;
  transferOptions?: TransferOptions;
}

export function BranchSettingsForm({
  branch,
  onSave,
  isSaving = false,
  mode = 'PAGE',
  backUrl = '/dashboard/branches',
  onCancel,
}: BranchSettingsFormProps) {
  const t = useTranslations('branches.settings');
  const tc = useTranslations('common');

  const [formData, setFormData] = useState<BranchSettingsFormData>({
    name: branch.name,
    contactPhone: branch.contactPhone ?? '',
    address: branch.address ?? '',
    deliveryConfig: branch.deliveryConfig ?? { type: 'FREE' },
    transferOptions: branch.transferOptions ?? DEFAULT_TRANSFER_OPTIONS,
    businessHours: branch.businessHours ?? {
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
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSave(formData);
    },
    [formData, onSave]
  );

  const updateField = useCallback(
    <K extends keyof BranchSettingsFormData>(
      field: K,
      value: BranchSettingsFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {mode === 'PAGE' && (
            <Link href={backUrl}>
              <Button type="button" variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {t('title', { branchName: branch.name })}
            </h1>
            <p className="text-slate-500 mt-1">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {mode === 'INLINE' && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {tc('buttons.cancel')}
            </Button>
          )}
          <Button type="submit" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {tc('buttons.save')}
          </Button>
        </div>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {t('basicInfo.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('basicInfo.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={t('basicInfo.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('basicInfo.contactPhone')}
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                placeholder={t('basicInfo.contactPhonePlaceholder')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t('basicInfo.address')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder={t('basicInfo.addressPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Configuración de envío */}
      <DeliveryConfigSection
        value={formData.deliveryConfig}
        onChange={(config) => updateField('deliveryConfig', config)}
      />

      {/* Pago por transferencia */}
      <TransferOptionsSection
        value={formData.transferOptions}
        onChange={(opts) => updateField('transferOptions', opts)}
      />

      {/* Horarios de atención */}
      <BusinessHoursSection
        value={formData.businessHours}
        onChange={(hours) => updateField('businessHours', hours)}
      />

      {/* Botones de acción al final */}
      <div className="flex justify-end gap-2">
        {mode === 'INLINE' && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tc('buttons.cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {tc('buttons.save')}
        </Button>
      </div>
    </form>
  );

  if (mode === 'PAGE') {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}
