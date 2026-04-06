import type {
  BusinessWithSettings,
  BusinessFormData,
  UpdateBusinessRequest,
  BusinessWorkingHours,
} from '../types/business-settings.types';

export function businessToFormData(business: BusinessWithSettings): BusinessFormData {
  const settings = business.settings || {};
  const wh = settings.workingHours || {};

  return {
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
    primaryColor: settings.primaryColor || '',
    accentColor: settings.accentColor || '',
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
}

export function formDataToUpdateRequest(formData: BusinessFormData): UpdateBusinessRequest {
  const workingHours: BusinessWorkingHours = {};

  if (formData.workingHours.monday.enabled) {
    workingHours.monday = { open: formData.workingHours.monday.open, close: formData.workingHours.monday.close };
  }
  if (formData.workingHours.tuesday.enabled) {
    workingHours.tuesday = { open: formData.workingHours.tuesday.open, close: formData.workingHours.tuesday.close };
  }
  if (formData.workingHours.wednesday.enabled) {
    workingHours.wednesday = { open: formData.workingHours.wednesday.open, close: formData.workingHours.wednesday.close };
  }
  if (formData.workingHours.thursday.enabled) {
    workingHours.thursday = { open: formData.workingHours.thursday.open, close: formData.workingHours.thursday.close };
  }
  if (formData.workingHours.friday.enabled) {
    workingHours.friday = { open: formData.workingHours.friday.open, close: formData.workingHours.friday.close };
  }
  if (formData.workingHours.saturday.enabled) {
    workingHours.saturday = { open: formData.workingHours.saturday.open, close: formData.workingHours.saturday.close };
  }
  if (formData.workingHours.sunday.enabled) {
    workingHours.sunday = { open: formData.workingHours.sunday.open, close: formData.workingHours.sunday.close };
  }

  return {
    name: formData.name,
    slug: formData.slug,
    phone: formData.phone || undefined,
    timezone: formData.timezone,
    currency: formData.currency,
    industryId: formData.industryId || undefined,
    catalogVisibility: formData.catalogVisibility,
    catalogMode: formData.catalogMode,
    autoSuggestThreshold: formData.autoSuggestThreshold,
    allowOrdersWithoutCatalog: formData.allowOrdersWithoutCatalog,
    catalogUrl: formData.catalogUrl || undefined,
    settings: {
      welcomeMessage: formData.welcomeMessage || undefined,
      logo: formData.logo || undefined,
      banner: formData.banner || undefined,
      primaryColor: formData.primaryColor || undefined,
      accentColor: formData.accentColor || undefined,
      description: formData.description || undefined,
      deliveryFee: formData.deliveryFee ?? undefined,
      workingHours: Object.keys(workingHours).length > 0 ? workingHours : undefined,
    },
  };
}

/**
 * Genera un slug a partir de un nombre
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
