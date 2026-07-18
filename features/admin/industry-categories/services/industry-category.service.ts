/**
 * Industry Category Service
 * 
 * API service for Super Admin industry category management.
 * 
 * Backend endpoints:
 * - GET /api/v1/industry-categories
 * - POST /api/v1/industry-categories
 * - GET /api/v1/industry-categories/:id
 * - PATCH /api/v1/industry-categories/:id
 * - DELETE /api/v1/industry-categories/:id
 * - PATCH /api/v1/industry-categories/:id/activate
 * - PATCH /api/v1/industry-categories/:id/deactivate
 * 
 * Error Handling:
 * - Uses apiClient interceptors for auth (401 redirects)
 * - Error messages extracted from backend responses
 * - Network errors handled by axios interceptors
 */

import apiClient from "@/services/api.service";
import type {
  IndustryCategory,
  CreateIndustryCategoryDto,
  UpdateIndustryCategoryDto,
  IndustryCategoryFilters,
} from "../types/industry-category.types";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Toggle between mock and real API
// Set to true during development without backend
const USE_MOCK = false;

// ============================================================================
// MOCK DATA (for development)
// ============================================================================

const mockIndustryCategories: IndustryCategory[] = [
  {
    id: "ic1",
    name: "Refrescos",
    slug: "refrescos",
    order: 1,
    icon: "🥤",
    color: "#ef4444",
    isActive: true,
    industries: [{ id: "ind1", name: "Bebidas" }],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "ic2",
    name: "Jugos",
    slug: "jugos",
    order: 2,
    icon: "🧃",
    color: "#f97316",
    isActive: true,
    industries: [{ id: "ind1", name: "Bebidas" }],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "ic3",
    name: "Snacks",
    slug: "snacks",
    order: 1,
    icon: "🍿",
    color: "#eab308",
    isActive: true,
    industries: [{ id: "ind2", name: "Alimentos" }],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "ic4",
    name: "Abarrotes",
    slug: "abarrotes",
    order: 2,
    icon: "🥫",
    color: "#22c55e",
    isActive: false,
    industries: [{ id: "ind2", name: "Alimentos" }],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// ============================================================================
// INDUSTRY CATEGORIES API
// ============================================================================

/**
 * Get all industry categories with optional filters
 * GET /api/v1/industry-categories
 */
export async function getIndustryCategories(
  filters?: IndustryCategoryFilters
): Promise<IndustryCategory[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    let filtered = [...mockIndustryCategories];
    
    if (filters?.industryIds && filters.industryIds.length > 0) {
      filtered = filtered.filter((c) => 
        c.industries.some(ind => filters.industryIds?.includes(ind.id))
      );
    }
    
    if (!filters?.includeInactive) {
      filtered = filtered.filter((c) => c.isActive);
    }
    
    return filtered.sort((a, b) => a.order - b.order);
  }

  const params = new URLSearchParams();
  if (filters?.industryIds && filters.industryIds.length > 0) {
    params.append("industryIds", filters.industryIds.join(","));
  }
  if (filters?.includeInactive) params.append("includeInactive", "true");

  const response = await apiClient.get<IndustryCategory[]>(
    `/industry-categories?${params}`
  );
  return response.data;
}

/**
 * Get a single industry category by ID
 * GET /api/v1/industry-categories/:id
 */
export async function getIndustryCategory(id: string): Promise<IndustryCategory> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const category = mockIndustryCategories.find((c) => c.id === id);
    if (!category) throw new Error("Category not found");
    return category;
  }

  const response = await apiClient.get<IndustryCategory>(`/industry-categories/${id}`);
  return response.data;
}

/**
 * Create a new industry category
 * POST /api/v1/industry-categories
 */
export async function createIndustryCategory(
  data: CreateIndustryCategoryDto
): Promise<IndustryCategory> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newCategory: IndustryCategory = {
      id: `ic_${Date.now()}`,
      name: data.name,
      slug: data.slug,
      order: data.order ?? 0,
      icon: data.icon,
      color: data.color,
      isActive: data.isActive ?? true,
      industries: [], // Will be populated based on industryIds
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockIndustryCategories.push(newCategory);
    return newCategory;
  }

  const response = await apiClient.post<IndustryCategory>("/industry-categories", data);
  return response.data;
}

/**
 * Update an industry category
 * PATCH /api/v1/industry-categories/:id
 */
export async function updateIndustryCategory(
  id: string,
  data: UpdateIndustryCategoryDto
): Promise<IndustryCategory> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockIndustryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    
    mockIndustryCategories[index] = {
      ...mockIndustryCategories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockIndustryCategories[index];
  }

  const response = await apiClient.patch<IndustryCategory>(
    `/industry-categories/${id}`,
    data
  );
  return response.data;
}

/**
 * Delete an industry category
 * DELETE /api/v1/industry-categories/:id
 */
export async function deleteIndustryCategory(id: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockIndustryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    mockIndustryCategories.splice(index, 1);
    return;
  }

  await apiClient.delete(`/industry-categories/${id}`);
}

/**
 * Activate an industry category
 * PATCH /api/v1/industry-categories/:id/activate
 */
export async function activateIndustryCategory(id: string): Promise<IndustryCategory> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockIndustryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    
    mockIndustryCategories[index] = {
      ...mockIndustryCategories[index],
      isActive: true,
      updatedAt: new Date().toISOString(),
    };
    return mockIndustryCategories[index];
  }

  const response = await apiClient.patch<IndustryCategory>(
    `/industry-categories/${id}/activate`
  );
  return response.data;
}

/**
 * Deactivate an industry category
 * PATCH /api/v1/industry-categories/:id/deactivate
 */
export async function deactivateIndustryCategory(id: string): Promise<IndustryCategory> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockIndustryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    
    mockIndustryCategories[index] = {
      ...mockIndustryCategories[index],
      isActive: false,
      updatedAt: new Date().toISOString(),
    };
    return mockIndustryCategories[index];
  }

  const response = await apiClient.patch<IndustryCategory>(
    `/industry-categories/${id}/deactivate`
  );
  return response.data;
}
