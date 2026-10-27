export interface PlatformPermissionDef {
  code: string;
  description: string;
}

export interface PlatformProfile {
  id: string;
  name: string;
  description: string | null;
  /** Perfil por defecto (Comercial, Supervisor): editable, no se borra. */
  isSystem: boolean;
  permissionCodes: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformProfileInput {
  name: string;
  description?: string;
  permissionCodes: string[];
}

export interface InternalUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  platformProfile: { id: string; name: string } | null;
}

export interface CreateInternalUserInput {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  platformProfileId: string;
}

export interface UpdateInternalUserInput {
  name?: string;
  phoneNumber?: string;
  password?: string;
  platformProfileId?: string;
  active?: boolean;
}
