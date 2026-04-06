import { z } from 'zod';

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const workingHoursDaySchema = z.object({
  open: z.string().regex(timeRegex, 'Formato inválido (HH:mm)'),
  close: z.string().regex(timeRegex, 'Formato inválido (HH:mm)'),
  enabled: z.boolean(),
}).refine((data) => {
  if (!data.enabled) return true;
  return data.open < data.close;
}, {
  message: 'La hora de apertura debe ser anterior a la de cierre',
  path: ['close'],
});

export const businessFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z.string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  phone: z.string().optional(),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  industryId: z.string().optional(),
  catalogVisibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']),
  catalogMode: z.enum(['MENU', 'MARKETPLACE', 'HYBRID']),
  autoSuggestThreshold: z.number().min(0).max(100),
  allowOrdersWithoutCatalog: z.boolean(),
  catalogUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  welcomeMessage: z.string().max(500).optional(),
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
  banner: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  deliveryFee: z.number().min(0).nullable(),
  workingHours: z.object({
    monday: workingHoursDaySchema,
    tuesday: workingHoursDaySchema,
    wednesday: workingHoursDaySchema,
    thursday: workingHoursDaySchema,
    friday: workingHoursDaySchema,
    saturday: workingHoursDaySchema,
    sunday: workingHoursDaySchema,
  }),
});

export type BusinessFormSchema = z.infer<typeof businessFormSchema>;
