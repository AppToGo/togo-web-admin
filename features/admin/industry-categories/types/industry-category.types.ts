/**
 * Industry Category Types
 * 
 * TypeScript interfaces for Industry Category management.
 */

export interface IndustryCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  industries: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    categories?: number;
  };
}

export interface CreateIndustryCategoryDto {
  name: string;
  slug: string;
  industryIds: string[];
  order?: number;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateIndustryCategoryDto {
  name?: string;
  slug?: string;
  order?: number;
  icon?: string;
  color?: string;
  isActive?: boolean;
  industryIds?: string[];
}

export interface IndustryCategoryFilters {
  industryIds?: string[];
  includeInactive?: boolean;
}
