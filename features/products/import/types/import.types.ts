export type ImportJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY_FOR_REVIEW'
  | 'CONFIRMING'
  | 'COMPLETED'
  | 'FAILED';

export type ImportJobSource = 'EXCEL' | 'CSV' | 'PDF' | 'IMAGE';

export interface ImportItemVariant {
  variantLabel: string;
  suggestedPrice?: number;
  internalSku?: string;
}

export interface ImportItem {
  id: string;
  jobId: string;
  businessId: string;
  name: string;
  description: string | null;
  price: number | null;
  rawCategory: string | null;
  businessCategoryId: string | null;
  industryCategoryId: string | null;
  suggestedGlobalProductId: string | null;
  suggestedGlobalProductName: string | null;
  matchScore: number | null;
  isSelected: boolean;
  importedProductId: string | null;
  importedGlobalProductId: string | null;
  importError: string | null;
  sku: string | null;
  brand: string | null;
  imageUrl: string | null;
  variants: ImportItemVariant[] | null;
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
  industryCategoryId?: string;
  isSelected?: boolean;
  imageUrl?: string;
  variants?: ImportItemVariant[];
}

export interface ConfirmImportDto {
  itemIds: string[];
}
