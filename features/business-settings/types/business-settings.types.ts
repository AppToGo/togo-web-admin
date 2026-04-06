export interface WorkingHoursDay {
  open: string;
  close: string;
}

export interface BusinessWorkingHours {
  monday?: WorkingHoursDay;
  tuesday?: WorkingHoursDay;
  wednesday?: WorkingHoursDay;
  thursday?: WorkingHoursDay;
  friday?: WorkingHoursDay;
  saturday?: WorkingHoursDay;
  sunday?: WorkingHoursDay;
}

export interface BusinessSettings {
  welcomeMessage?: string;
  logo?: string;
  banner?: string;
  primaryColor?: string;
  accentColor?: string;
  description?: string;
  workingHours?: BusinessWorkingHours;
  deliveryFee?: number;
}

export interface BusinessWithSettings {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  timezone: string;
  currency: string;
  industryId?: string;
  catalogVisibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  catalogMode: 'MENU' | 'MARKETPLACE' | 'HYBRID';
  autoSuggestThreshold: number;
  allowOrdersWithoutCatalog: boolean;
  catalogUrl?: string;
  settings: BusinessSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  slug?: string;
  phone?: string;
  timezone?: string;
  currency?: string;
  industryId?: string;
  catalogVisibility?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  catalogMode?: 'MENU' | 'MARKETPLACE' | 'HYBRID';
  autoSuggestThreshold?: number;
  allowOrdersWithoutCatalog?: boolean;
  catalogUrl?: string;
  settings?: BusinessSettings;
}

export interface WorkingHoursFormDay {
  open: string;
  close: string;
  enabled: boolean;
}

export interface BusinessFormData {
  name: string;
  slug: string;
  phone: string;
  timezone: string;
  currency: string;
  industryId: string;
  catalogVisibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  catalogMode: 'MENU' | 'MARKETPLACE' | 'HYBRID';
  autoSuggestThreshold: number;
  allowOrdersWithoutCatalog: boolean;
  catalogUrl: string;
  welcomeMessage: string;
  logo: string;
  banner: string;
  primaryColor: string;
  accentColor: string;
  description: string;
  deliveryFee: number | null;
  workingHours: {
    monday: WorkingHoursFormDay;
    tuesday: WorkingHoursFormDay;
    wednesday: WorkingHoursFormDay;
    thursday: WorkingHoursFormDay;
    friday: WorkingHoursFormDay;
    saturday: WorkingHoursFormDay;
    sunday: WorkingHoursFormDay;
  };
}
