/**
 * Business Types
 * Types for business management
 */

export interface Business {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  phone?: string;
  industryId?: string;
  industry?: {
    id: string;
    name: string;
  };
  catalogVisibility: 'TOKEN_ONLY' | 'PUBLIC' | 'DISABLED';
  catalogMode: 'MANUAL' | 'AUTO_GENERATED' | 'HYBRID';
  createdAt: string;
  updatedAt: string;
  subscriptionPlan?: number;
  settings?: Record<string, unknown>;
  botVoice?: Partial<BotVoice>;
}

/**
 * Voz del asistente de WhatsApp (plan bot natural, T18): trato al cliente,
 * emojis y nombre opcional del asistente.
 */
export interface BotVoice {
  address: 'tu' | 'usted';
  emojis: boolean;
  assistantName?: string;
}

/** Tres mensajes de ejemplo con una voz, armados por la API. */
export interface BotVoicePreview {
  greeting: string;
  productFound: string;
  addedToCart: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  slug?: string;
  phone?: string;
  industryId?: string;
  catalogVisibility?: 'TOKEN_ONLY' | 'PUBLIC' | 'DISABLED';
  catalogMode?: 'MANUAL' | 'AUTO_GENERATED' | 'HYBRID';
  settings?: Record<string, unknown>;
  botVoice?: Partial<BotVoice>;
}

export interface BusinessFormData {
  name: string;
  slug: string;
  phone: string;
  industryId: string;
  catalogVisibility: 'TOKEN_ONLY' | 'PUBLIC' | 'DISABLED';
  catalogMode: 'MANUAL' | 'AUTO_GENERATED' | 'HYBRID';
  primaryColor: string;
  accentColor: string;
  description: string;
  welcomeMessage: string;
}
