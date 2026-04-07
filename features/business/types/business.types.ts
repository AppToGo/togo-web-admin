/**
 * Business Types
 * Types for business management
 */

export interface Business {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  phone?: string;
  description?: string;
  welcomeMessage?: string;
  industryId?: string;
  industry?: {
    id: string;
    name: string;
  };
  catalogVisibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  catalogMode: 'MENU' | 'MARKETPLACE' | 'HYBRID';
  createdAt: string;
  updatedAt: string;
  subscriptionPlan?: number;
}

export interface UpdateBusinessRequest {
  name?: string;
  slug?: string;
  phone?: string;
  description?: string;
  welcomeMessage?: string;
  industryId?: string;
  catalogVisibility?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  catalogMode?: 'MENU' | 'MARKETPLACE' | 'HYBRID';
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface BusinessFormData {
  name: string;
  slug: string;
  phone: string;
  industryId: string;
  catalogVisibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  catalogMode: 'MENU' | 'MARKETPLACE' | 'HYBRID';
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  accentColor: string;
  description: string;
  welcomeMessage: string;
}
