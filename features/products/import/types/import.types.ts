export type ImportJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY_FOR_REVIEW'
  | 'CONFIRMING'
  | 'COMPLETED'
  | 'FAILED';

export type ImportJobSource = 'EXCEL' | 'CSV' | 'PDF' | 'IMAGE';

export interface ImportItem {
  id: string;
  jobId: string;
  businessId: string;
  name: string;
  description: string | null;
  price: number | null;
  rawCategory: string | null;
  businessCategoryId: string | null;
  suggestedGlobalProductId: string | null;
  suggestedGlobalProductName: string | null;
  matchScore: number | null;
  isSelected: boolean;
  importedProductId: string | null;
  importError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportJob {
  id: string;
  businessId: string;
  uploadedByUserId: string | null; // FIX O
  source: ImportJobSource;
  status: ImportJobStatus;
  fileName: string;
  // FIX R: fileKey removed — internal storage key is not exposed by the API
  fileSize: number;
  mimeType: string;
  totalDetected: number;
  totalImported: number;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  items: ImportItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedImportJobs {
  items: ImportJob[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateImportItemDto {
  name?: string;
  description?: string;
  price?: number;
  businessCategoryId?: string;
  isSelected?: boolean;
}

export interface ConfirmImportDto {
  itemIds: string[];
}
