/**
 * Admin Catalog Service
 * 
 * API service for Super Admin global product catalog management.
 * 
 * Backend endpoints:
 * - GET /api/v1/admin/global-products
 * - POST /api/v1/admin/global-products
 * - GET /api/v1/admin/global-products/:id
 * - PATCH /api/v1/admin/global-products/:id
 * - DELETE /api/v1/admin/global-products/:id
 * - GET /api/v1/admin/global-products/:id/stats
 * - POST /api/v1/admin/global-products/import
 * - GET /api/v1/admin/global-products/stats
 * - GET /api/v1/admin/industries
 * - GET /api/v1/admin/industries/:id/categories
 * 
 * Error Handling:
 * - Uses apiClient interceptors for auth (401 redirects)
 * - Error messages extracted from backend responses
 * - Network errors handled by axios interceptors
 */

import apiClient from "@/services/api.service";
import type {
  GlobalProduct,
  GlobalProductStats,
  CreateGlobalProductDto,
  UpdateGlobalProductDto,
  GlobalProductFilters,
  PaginatedGlobalProducts,
  BulkImportResult,
  GlobalCatalogStats,
  Industry,
  IndustryCategory,
} from "../types/admin-catalog.types";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Toggle between mock and real API
// Set to true during development without backend
const USE_MOCK = false;

// ============================================================================
// MOCK DATA (for development)
// ============================================================================

const mockIndustries: Industry[] = [
  { id: "ind1", name: "Bebidas", slug: "bebidas", description: "Bebidas y refrescos", isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "ind2", name: "Alimentos", slug: "alimentos", description: "Productos alimenticios", isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "ind3", name: "Farmacia", slug: "farmacia", description: "Productos farmacéuticos", isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "ind4", name: "Limpieza", slug: "limpieza", description: "Productos de limpieza", isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
];

const mockIndustryCategories: IndustryCategory[] = [
  { id: "cat1", industryId: "ind1", name: "Refrescos", slug: "refrescos", sortOrder: 1, isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "cat2", industryId: "ind1", name: "Jugos", slug: "jugos", sortOrder: 2, isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "cat3", industryId: "ind2", name: "Snacks", slug: "snacks", sortOrder: 1, isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "cat4", industryId: "ind2", name: "Abarrotes", slug: "abarrotes", sortOrder: 2, isActive: true, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
];

const mockGlobalProducts: GlobalProduct[] = [
  {
    id: "gp1",
    sku: "COCA-COLA-350ML",
    name: "Coca Cola 350ml",
    description: "Refresco de cola en lata de 350ml",
    brand: "Coca Cola",
    industryId: "ind1",
    industry: mockIndustries[0],
    industryCategoryId: "cat1",
    industryCategory: mockIndustryCategories[0],
    image: "https://placehold.co/400x400/e53935/ffffff?text=Coca+Cola",
    attributes: { volume: "350ml", packaging: "Lata", type: "Regular" },
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-10T14:30:00Z",
    _count: { businessProducts: 150 },
  },
  {
    id: "gp2",
    sku: "COCA-COLA-1.5L",
    name: "Coca Cola 1.5L",
    description: "Refresco de cola en botella de 1.5 litros",
    brand: "Coca Cola",
    industryId: "ind1",
    industry: mockIndustries[0],
    industryCategoryId: "cat1",
    industryCategory: mockIndustryCategories[0],
    image: "https://placehold.co/400x400/e53935/ffffff?text=Coca+Cola+1.5L",
    attributes: { volume: "1.5L", packaging: "Botella", type: "Regular" },
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-10T14:30:00Z",
    _count: { businessProducts: 120 },
  },
  {
    id: "gp3",
    sku: "PEPSI-350ML",
    name: "Pepsi 350ml",
    description: "Refresco de cola Pepsi en lata",
    brand: "Pepsi",
    industryId: "ind1",
    industry: mockIndustries[0],
    industryCategoryId: "cat1",
    industryCategory: mockIndustryCategories[0],
    image: "https://placehold.co/400x400/1565c0/ffffff?text=Pepsi",
    attributes: { volume: "350ml", packaging: "Lata", type: "Regular" },
    isActive: true,
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-03-12T14:30:00Z",
    _count: { businessProducts: 95 },
  },
  {
    id: "gp4",
    sku: "DORITOS-NACHO",
    name: "Doritos Nacho Cheese",
    description: "Botana de maíz sabor queso nacho",
    brand: "Doritos",
    industryId: "ind2",
    industry: mockIndustries[1],
    industryCategoryId: "cat3",
    industryCategory: mockIndustryCategories[2],
    image: "https://placehold.co/400x400/ff6f00/ffffff?text=Doritos",
    attributes: { weight: "62g", flavor: "Nacho Cheese" },
    isActive: true,
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-03-15T14:30:00Z",
    _count: { businessProducts: 80 },
  },
  {
    id: "gp5",
    sku: "SABRITAS-ORIGINAL",
    name: "Sabritas Original",
    description: "Papas fritas clásicas",
    brand: "Sabritas",
    industryId: "ind2",
    industry: mockIndustries[1],
    industryCategoryId: "cat3",
    industryCategory: mockIndustryCategories[2],
    image: "https://placehold.co/400x400/fbc02d/ffffff?text=Sabritas",
    attributes: { weight: "55g", flavor: "Original" },
    isActive: true,
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-03-15T14:30:00Z",
    _count: { businessProducts: 110 },
  },
  {
    id: "gp6",
    sku: "PARACETAMOL-500MG",
    name: "Paracetamol 500mg",
    description: "Analgésico y antipirético",
    brand: "Genérico",
    industryId: "ind3",
    industry: mockIndustries[2],
    image: "https://placehold.co/400x400/4caf50/ffffff?text=Paracetamol",
    attributes: { dosage: "500mg", presentation: "Tabletas", quantity: "20" },
    isActive: true,
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-03-20T14:30:00Z",
    _count: { businessProducts: 200 },
  },
  {
    id: "gp7",
    sku: "CLOROX-1L",
    name: "Clorox 1 Litro",
    description: "Blanqueador multiusos",
    brand: "Clorox",
    industryId: "ind4",
    industry: mockIndustries[3],
    image: "https://placehold.co/400x400/00acc1/ffffff?text=Clorox",
    attributes: { volume: "1L", type: "Original" },
    isActive: false,
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-03-25T14:30:00Z",
    _count: { businessProducts: 45 },
  },
];

// ============================================================================
// GLOBAL PRODUCTS API
// ============================================================================

/**
 * Get all global products with filters and pagination
 * GET /api/v1/admin/global-products
 */
export async function getGlobalProducts(
  filters?: GlobalProductFilters
): Promise<PaginatedGlobalProducts> {
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filtered = [...mockGlobalProducts];

    // Apply filters
    if (filters?.industryId) {
      filtered = filtered.filter((p) => p.industryId === filters.industryId);
    }
    if (filters?.brand) {
      filtered = filtered.filter((p) => p.brand === filters.brand);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.sku.toLowerCase().includes(search) ||
          p.name.toLowerCase().includes(search)
      );
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter((p) => p.isActive === filters.isActive);
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  const params = new URLSearchParams();
  if (filters?.industryId) params.append("industryId", filters.industryId);
  if (filters?.brand) params.append("brand", filters.brand);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.isActive !== undefined)
    params.append("isActive", String(filters.isActive));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const response = await apiClient.get<PaginatedGlobalProducts>(
    `/admin/global-products?${params}`
  );
  return response.data;
}

/**
 * Get a single global product by ID
 * GET /api/v1/admin/global-products/:id
 */
export async function getGlobalProduct(id: string): Promise<GlobalProduct> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const product = mockGlobalProducts.find((p) => p.id === id);
    if (!product) throw new Error("Producto no encontrado");
    return product;
  }

  const response = await apiClient.get<GlobalProduct>(`/admin/global-products/${id}`);
  return response.data;
}

/**
 * Create a new global product
 * POST /api/v1/admin/global-products
 */
export async function createGlobalProduct(
  data: CreateGlobalProductDto
): Promise<GlobalProduct> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Check SKU uniqueness
    if (mockGlobalProducts.some((p) => p.sku === data.sku)) {
      throw new Error("El SKU ya existe");
    }

    const industry = mockIndustries.find((i) => i.id === data.industryId);
    const category = mockIndustryCategories.find((c) => c.id === data.industryCategoryId);

    const newProduct: GlobalProduct = {
      id: `gp${Date.now()}`,
      ...data,
      industry,
      industryCategory: category,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { businessProducts: 0 },
    };

    mockGlobalProducts.push(newProduct);
    return newProduct;
  }

  const response = await apiClient.post<GlobalProduct>("/admin/global-products", data);
  return response.data;
}

/**
 * Update a global product
 * PATCH /api/v1/admin/global-products/:id
 */
export async function updateGlobalProduct(
  id: string,
  data: UpdateGlobalProductDto
): Promise<GlobalProduct> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const index = mockGlobalProducts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Producto no encontrado");

    // Check SKU uniqueness if changing
    if (data.sku && data.sku !== mockGlobalProducts[index].sku) {
      if (mockGlobalProducts.some((p) => p.sku === data.sku && p.id !== id)) {
        throw new Error("El SKU ya existe");
      }
    }

    const industry = data.industryId
      ? mockIndustries.find((i) => i.id === data.industryId)
      : mockGlobalProducts[index].industry;
    const category = data.industryCategoryId
      ? mockIndustryCategories.find((c) => c.id === data.industryCategoryId)
      : mockGlobalProducts[index].industryCategory;

    mockGlobalProducts[index] = {
      ...mockGlobalProducts[index],
      ...data,
      industry,
      industryCategory: category,
      updatedAt: new Date().toISOString(),
    };

    return mockGlobalProducts[index];
  }

  const response = await apiClient.patch<GlobalProduct>(`/admin/global-products/${id}`, data);
  return response.data;
}

/**
 * Delete a global product
 * DELETE /api/v1/admin/global-products/:id
 */
export async function deleteGlobalProduct(id: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockGlobalProducts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Producto no encontrado");
    mockGlobalProducts.splice(index, 1);
    return;
  }

  await apiClient.delete(`/admin/global-products/${id}`);
}

/**
 * Toggle global product status
 * PATCH /api/v1/admin/global-products/:id/status
 */
export async function toggleGlobalProductStatus(
  id: string,
  isActive: boolean
): Promise<GlobalProduct> {
  return updateGlobalProduct(id, { isActive });
}

/**
 * Check if SKU is available
 * GET /api/v1/admin/global-products/check-sku
 */
export async function checkSkuAvailability(
  sku: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const exists = mockGlobalProducts.some(
      (p) => p.sku === sku && p.id !== excludeId
    );
    return { available: !exists };
  }

  const params = new URLSearchParams();
  params.append("sku", sku);
  if (excludeId) params.append("excludeId", excludeId);

  const response = await apiClient.get<{ available: boolean }>(
    `/admin/global-products/check-sku?${params}`
  );
  return response.data;
}

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get global product usage statistics
 * GET /api/v1/admin/global-products/:id/stats
 */
export async function getGlobalProductStats(id: string): Promise<GlobalProductStats> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const product = mockGlobalProducts.find((p) => p.id === id);
    if (!product) throw new Error("Producto no encontrado");

    return {
      totalActivations: product._count?.businessProducts || 0,
      byIndustry: {
        "Farmacias": Math.floor((product._count?.businessProducts || 0) * 0.4),
        "Minimarkets": Math.floor((product._count?.businessProducts || 0) * 0.35),
        "Tiendas de conveniencia": Math.floor((product._count?.businessProducts || 0) * 0.25),
      },
      byBusinessType: {
        "Independiente": 60,
        "Franquicia": 40,
      },
      lastActivatedAt: new Date().toISOString(),
      topBusinesses: [
        { businessId: "b1", businessName: "Farmacia San Pablo", count: 15 },
        { businessId: "b2", businessName: "OXXO Centro", count: 12 },
        { businessId: "b3", businessName: "Minisuper La Esquina", count: 8 },
      ],
    };
  }

  const response = await apiClient.get<GlobalProductStats>(`/admin/global-products/${id}/stats`);
  return response.data;
}

/**
 * Get global catalog statistics
 * GET /api/v1/admin/global-products/stats
 */
export async function getGlobalCatalogStats(): Promise<GlobalCatalogStats> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const activeProducts = mockGlobalProducts.filter((p) => p.isActive);
    const inactiveProducts = mockGlobalProducts.filter((p) => !p.isActive);

    // Group by industry
    const byIndustry = mockIndustries.map((ind) => ({
      industryId: ind.id,
      industryName: ind.name,
      count: mockGlobalProducts.filter((p) => p.industryId === ind.id).length,
    }));

    // Top brands
    const brandCount: Record<string, number> = {};
    mockGlobalProducts.forEach((p) => {
      if (p.brand) {
        brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
      }
    });
    const topBrands = Object.entries(brandCount)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most activated
    const mostActivated = [...mockGlobalProducts]
      .sort((a, b) => (b._count?.businessProducts || 0) - (a._count?.businessProducts || 0))
      .slice(0, 5)
      .map((p) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        activationCount: p._count?.businessProducts || 0,
      }));

    return {
      totalProducts: mockGlobalProducts.length,
      activeProducts: activeProducts.length,
      inactiveProducts: inactiveProducts.length,
      productsByIndustry: byIndustry,
      topBrands,
      mostActivatedProducts: mostActivated,
      recentActivity: [
        { action: "created", productId: "gp1", productName: "Coca Cola 350ml", userId: "u1", userName: "Admin", timestamp: new Date().toISOString() },
        { action: "updated", productId: "gp2", productName: "Coca Cola 1.5L", userId: "u1", userName: "Admin", timestamp: new Date(Date.now() - 86400000).toISOString() },
      ],
    };
  }

  const response = await apiClient.get<GlobalCatalogStats>("/admin/global-products/stats");
  return response.data;
}

// ============================================================================
// INDUSTRIES API
// ============================================================================

/**
 * Get all industries
 * GET /api/v1/admin/industries
 */
export async function getIndustries(): Promise<Industry[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockIndustries;
  }

  const response = await apiClient.get<Industry[]>("/industries");
  return response.data;
}

/**
 * Get industry categories
 * GET /api/v1/admin/industries/:id/categories
 */
export async function getIndustryCategories(industryId: string): Promise<IndustryCategory[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockIndustryCategories.filter((c) => c.industryId === industryId);
  }

  const response = await apiClient.get<IndustryCategory[]>(
    `/admin/industries/${industryId}/categories`
  );
  return response.data;
}

/**
 * Get all brands (from existing products)
 * GET /api/v1/admin/global-products/brands
 */
export async function getBrands(): Promise<string[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const brands = new Set<string>();
    mockGlobalProducts.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }

  const response = await apiClient.get<string[]>("/admin/global-products/brands");
  return response.data;
}

// ============================================================================
// BULK IMPORT API
// ============================================================================

/**
 * Import products from CSV/Excel
 * POST /api/v1/admin/global-products/import
 */
export async function bulkImportProducts(file: File): Promise<BulkImportResult> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Simulate processing
    return {
      success: true,
      totalRows: 10,
      imported: 8,
      failed: 1,
      skipped: 1,
      results: [
        { row: 1, sku: "TEST-001", success: true, productId: "gp_new_1" },
        { row: 2, sku: "TEST-002", success: true, productId: "gp_new_2" },
        { row: 9, sku: "EXISTING", success: false, error: "El SKU ya existe" },
      ],
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<BulkImportResult>(
    "/admin/global-products/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

/**
 * Generate CSV import template
 */
export function generateImportTemplate(): string {
  const headers = ["sku", "name", "description", "brand", "industryId", "industryCategoryId", "imageUrl", "attributes"];
  const example = [
    "COCA-COLA-350ML",
    "Coca Cola 350ml",
    "Refresco de cola en lata",
    "Coca Cola",
    "ind1",
    "cat1",
    "https://example.com/image.jpg",
    '{"volume":"350ml","packaging":"Lata"}',
  ];
  
  return [headers.join(","), example.join(",")].join("\n");
}

/**
 * Download import template
 */
export function downloadImportTemplate(): void {
  const csv = generateImportTemplate();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", "global-products-template.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
