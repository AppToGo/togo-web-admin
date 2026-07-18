import apiClient from "@/services/api.service";
import type {
  ImportJob,
  PaginatedImportJobs,
  UpdateImportItemDto,
  ConfirmImportDto,
  ImportItem,
} from "../types/import.types";

const base = (businessId: string) =>
  `/businesses/${businessId}/products/import`;

export async function uploadImportFile(
  businessId: string,
  file: File
): Promise<ImportJob> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ImportJob>(base(businessId), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function listImportJobs(
  businessId: string,
  page = 1,
  limit = 20
): Promise<PaginatedImportJobs> {
  const response = await apiClient.get<PaginatedImportJobs>(
    `${base(businessId)}?page=${page}&limit=${limit}`
  );
  return response.data;
}

export async function getImportJob(
  businessId: string,
  jobId: string
): Promise<ImportJob> {
  const response = await apiClient.get<ImportJob>(
    `${base(businessId)}/${jobId}`
  );
  return response.data;
}

export async function updateImportItem(
  businessId: string,
  jobId: string,
  itemId: string,
  dto: UpdateImportItemDto
): Promise<ImportItem> {
  const response = await apiClient.patch<ImportItem>(
    `${base(businessId)}/${jobId}/items/${itemId}`,
    dto
  );
  return response.data;
}

export async function deleteImportItem(
  businessId: string,
  jobId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete(`${base(businessId)}/${jobId}/items/${itemId}`);
}

export async function confirmImportJob(
  businessId: string,
  jobId: string,
  dto: ConfirmImportDto
): Promise<ImportJob> {
  const response = await apiClient.post<ImportJob>(
    `${base(businessId)}/${jobId}/confirm`,
    dto
  );
  return response.data;
}
