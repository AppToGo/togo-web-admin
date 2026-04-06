'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Store,
  Globe,
  ShoppingCart,
  Palette,
  Clock,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WorkingHoursField } from './WorkingHoursField';
import { businessFormSchema } from '../validations/business-form.schema';
import { generateSlug } from '../utils/settings-mappers';
import type { BusinessFormData, BusinessWithSettings } from '../types/business-settings.types';
import type { BusinessFormSchema } from '../validations/business-form.schema';

interface BusinessFormProps {
  business: BusinessWithSettings;
  onSubmit: (data: BusinessFormData, originalSlug: string) => void;
  isLoading?: boolean;
  canEdit: boolean;
}

export function BusinessForm({ business, onSubmit, isLoading = false, canEdit }: BusinessFormProps) {
  const t = useTranslations('businessSettings');
  const tCommon = useTranslations('common');
  const [showSlugWarning, setShowSlugWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<BusinessFormData | null>(null);
  const [hasUserEditedSlug, setHasUserEditedSlug] = useState(false);

  const settings = business.settings || {};
  const wh = settings.workingHours || {};

  const defaultValues: BusinessFormData = {
    name: business.name,
    slug: business.slug,
    phone: business.phone || '',
    timezone: business.timezone,
    currency: business.currency,
    industryId: business.industryId || '',
    catalogVisibility: business.catalogVisibility,
    catalogMode: business.catalogMode,
    autoSuggestThreshold: business.autoSuggestThreshold,
    allowOrdersWithoutCatalog: business.allowOrdersWithoutCatalog,
    catalogUrl: business.catalogUrl || '',
    welcomeMessage: settings.welcomeMessage || '',
    logo: settings.logo || '',
    banner: settings.banner || '',
    primaryColor: settings.primaryColor || '#6366F1',
    accentColor: settings.accentColor || '#8B5CF6',
    description: settings.description || '',
    deliveryFee: settings.deliveryFee ?? null,
    workingHours: {
      monday: { open: wh.monday?.open || '09:00', close: wh.monday?.close || '18:00', enabled: !!wh.monday },
      tuesday: { open: wh.tuesday?.open || '09:00', close: wh.tuesday?.close || '18:00', enabled: !!wh.tuesday },
      wednesday: { open: wh.wednesday?.open || '09:00', close: wh.wednesday?.close || '18:00', enabled: !!wh.wednesday },
      thursday: { open: wh.thursday?.open || '09:00', close: wh.thursday?.close || '18:00', enabled: !!wh.thursday },
      friday: { open: wh.friday?.open || '09:00', close: wh.friday?.close || '18:00', enabled: !!wh.friday },
      saturday: { open: wh.saturday?.open || '09:00', close: wh.saturday?.close || '18:00', enabled: !!wh.saturday },
      sunday: { open: wh.sunday?.open || '09:00', close: wh.sunday?.close || '18:00', enabled: !!wh.sunday },
    },
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormSchema>({
    resolver: zodResolver(businessFormSchema),
    defaultValues,
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');
  const workingHoursValue = watch('workingHours');

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue && !hasUserEditedSlug) {
      const newSlug = generateSlug(nameValue);
      if (newSlug !== slugValue) {
        setValue('slug', newSlug, { shouldValidate: true });
      }
    }
  }, [nameValue, hasUserEditedSlug, slugValue, setValue]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasUserEditedSlug(true);
    setValue('slug', e.target.value, { shouldValidate: true });
  };

  const handleWorkingHoursChange = useCallback(
    (value: BusinessFormData['workingHours']) => {
      setValue('workingHours', value, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  const handleFormSubmit: SubmitHandler<BusinessFormSchema> = (data) => {
    const formData = data as BusinessFormData;
    // Check if slug changed
    if (formData.slug !== business.slug) {
      setPendingSubmit(formData);
      setShowSlugWarning(true);
      return;
    }
    onSubmit(formData, business.slug);
  };

  const confirmSlugChange = () => {
    if (pendingSubmit) {
      onSubmit(pendingSubmit, business.slug);
      setPendingSubmit(null);
    }
    setShowSlugWarning(false);
  };

  const cancelSlugChange = () => {
    setPendingSubmit(null);
    setShowSlugWarning(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información Básica */}
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-500" />
              {t('sections.basic')}
            </CardTitle>
            <CardDescription>{t('descriptions.basic')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('fields.name')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  disabled={isLoading || !canEdit}
                  error={errors.name?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  {t('fields.slug')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  onChange={handleSlugChange}
                  disabled={isLoading || !canEdit}
                  error={errors.slug?.message}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('fields.phone')}</Label>
              <Input
                id="phone"
                {...register('phone')}
                disabled={isLoading || !canEdit}
                error={errors.phone?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración Regional */}
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              {t('sections.regional')}
            </CardTitle>
            <CardDescription>{t('descriptions.regional')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  {t('fields.timezone')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="timezone"
                  {...register('timezone')}
                  disabled={isLoading || !canEdit}
                  error={errors.timezone?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">
                  {t('fields.currency')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currency"
                  {...register('currency')}
                  disabled={isLoading || !canEdit}
                  error={errors.currency?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catálogo y Ventas */}
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-500" />
              {t('sections.catalog')}
            </CardTitle>
            <CardDescription>{t('descriptions.catalog')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="catalogVisibility">
                  {t('fields.catalogVisibility')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('catalogVisibility')}
                  onValueChange={(value) => setValue('catalogVisibility', value as 'PUBLIC' | 'PRIVATE' | 'RESTRICTED')}
                  disabled={isLoading || !canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">{t('catalogVisibility.public')}</SelectItem>
                    <SelectItem value="PRIVATE">{t('catalogVisibility.private')}</SelectItem>
                    <SelectItem value="RESTRICTED">{t('catalogVisibility.restricted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalogMode">
                  {t('fields.catalogMode')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('catalogMode')}
                  onValueChange={(value) => setValue('catalogMode', value as 'MENU' | 'MARKETPLACE' | 'HYBRID')}
                  disabled={isLoading || !canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENU">{t('catalogMode.menu')}</SelectItem>
                    <SelectItem value="MARKETPLACE">{t('catalogMode.marketplace')}</SelectItem>
                    <SelectItem value="HYBRID">{t('catalogMode.hybrid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalogUrl">{t('fields.catalogUrl')}</Label>
              <Input
                id="catalogUrl"
                {...register('catalogUrl')}
                disabled={isLoading || !canEdit}
                error={errors.catalogUrl?.message}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="autoSuggestThreshold">{t('fields.autoSuggestThreshold')}</Label>
                <Input
                  id="autoSuggestThreshold"
                  type="number"
                  min={0}
                  max={100}
                  {...register('autoSuggestThreshold', { valueAsNumber: true })}
                  disabled={isLoading || !canEdit}
                  error={errors.autoSuggestThreshold?.message}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={watch('allowOrdersWithoutCatalog')}
                  onCheckedChange={(checked) => setValue('allowOrdersWithoutCatalog', checked)}
                  disabled={isLoading || !canEdit}
                />
                <Label>{t('fields.allowOrdersWithoutCatalog')}</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              {t('sections.appearance')}
            </CardTitle>
            <CardDescription>{t('descriptions.appearance')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">{t('fields.welcomeMessage')}</Label>
              <Textarea
                id="welcomeMessage"
                {...register('welcomeMessage')}
                disabled={isLoading || !canEdit}
                rows={2}
              />
              {errors.welcomeMessage && (
                <p className="text-xs text-red-500">{errors.welcomeMessage.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('fields.description')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                disabled={isLoading || !canEdit}
                rows={4}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo">{t('fields.logo')}</Label>
                <Input
                  id="logo"
                  {...register('logo')}
                  disabled={isLoading || !canEdit}
                  error={errors.logo?.message}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner">{t('fields.banner')}</Label>
                <Input
                  id="banner"
                  {...register('banner')}
                  disabled={isLoading || !canEdit}
                  error={errors.banner?.message}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t('fields.primaryColor')}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={watch('primaryColor') || '#6366F1'}
                    onChange={(e) => setValue('primaryColor', e.target.value)}
                    disabled={isLoading || !canEdit}
                    className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    id="primaryColor"
                    {...register('primaryColor')}
                    disabled={isLoading || !canEdit}
                    error={errors.primaryColor?.message}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">{t('fields.accentColor')}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={watch('accentColor') || '#8B5CF6'}
                    onChange={(e) => setValue('accentColor', e.target.value)}
                    disabled={isLoading || !canEdit}
                    className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    id="accentColor"
                    {...register('accentColor')}
                    disabled={isLoading || !canEdit}
                    error={errors.accentColor?.message}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios de Atención */}
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              {t('sections.hours')}
            </CardTitle>
            <CardDescription>{t('descriptions.hours')}</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkingHoursField
              value={workingHoursValue}
              onChange={handleWorkingHoursChange}
              disabled={isLoading || !canEdit}
            />
          </CardContent>
        </Card>

        {/* Configuración de Delivery */}
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500" />
              {t('sections.delivery')}
            </CardTitle>
            <CardDescription>{t('descriptions.delivery')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">{t('fields.deliveryFee')}</Label>
              <Input
                id="deliveryFee"
                type="number"
                min={0}
                step={0.01}
                {...register('deliveryFee', { 
                  valueAsNumber: true, 
                  setValueAs: (v) => (v === '' ? null : parseFloat(v)) 
                })}
                disabled={isLoading || !canEdit}
                error={errors.deliveryFee?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {canEdit && (
          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isLoading} isLoading={isLoading}>
              {tCommon('buttons.saveChanges')}
            </Button>
          </div>
        )}
      </form>

      {/* Slug Change Warning Dialog */}
      <AlertDialog open={showSlugWarning} onOpenChange={setShowSlugWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t('slugWarning.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('slugWarning.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSlugChange}>{tCommon('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSlugChange}>{t('slugWarning.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
