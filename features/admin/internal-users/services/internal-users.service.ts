/**
 * Usuarios internos de ToGo y sus perfiles (solo SUPER_ADMIN).
 *
 * - GET/POST /admin/internal-users, PATCH /admin/internal-users/:id
 * - GET/POST /admin/platform-profiles, PATCH/DELETE /admin/platform-profiles/:id
 * - GET /admin/platform-permissions
 */

import apiClient from "@/services/api.service";
import type {
  CreateInternalUserInput,
  InternalUser,
  PlatformPermissionDef,
  PlatformProfile,
  PlatformProfileInput,
  UpdateInternalUserInput,
} from "../types";

export async function getInternalUsers(): Promise<InternalUser[]> {
  const response = await apiClient.get<InternalUser[]>("/admin/internal-users");
  return response.data;
}

export async function createInternalUser(
  data: CreateInternalUserInput
): Promise<InternalUser> {
  const response = await apiClient.post<InternalUser>("/admin/internal-users", data);
  return response.data;
}

export async function updateInternalUser(
  id: string,
  data: UpdateInternalUserInput
): Promise<InternalUser> {
  const response = await apiClient.patch<InternalUser>(`/admin/internal-users/${id}`, data);
  return response.data;
}

export async function getPlatformProfiles(): Promise<PlatformProfile[]> {
  const response = await apiClient.get<PlatformProfile[]>("/admin/platform-profiles");
  return response.data;
}

export async function createPlatformProfile(
  data: PlatformProfileInput
): Promise<PlatformProfile> {
  const response = await apiClient.post<PlatformProfile>("/admin/platform-profiles", data);
  return response.data;
}

export async function updatePlatformProfile(
  id: string,
  data: Partial<PlatformProfileInput>
): Promise<PlatformProfile> {
  const response = await apiClient.patch<PlatformProfile>(
    `/admin/platform-profiles/${id}`,
    data
  );
  return response.data;
}

export async function deletePlatformProfile(id: string): Promise<void> {
  await apiClient.delete(`/admin/platform-profiles/${id}`);
}

export async function getPlatformPermissions(): Promise<PlatformPermissionDef[]> {
  const response = await apiClient.get<PlatformPermissionDef[]>(
    "/admin/platform-permissions"
  );
  return response.data;
}
