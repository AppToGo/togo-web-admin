/**
 * Catalog Mock Data
 * 
 * Mock data for parallel development while backend is being built.
 * TODO: Remove this file when backend is ready
 */

import type {
  GlobalProduct,
  BusinessProduct,
  BusinessCategory,
} from "../types/catalog.types";

// ============================================================================
// MOCK GLOBAL PRODUCTS (Catálogo TOGO)
// ============================================================================

export const mockGlobalProducts: GlobalProduct[] = [
  {
    id: "gp1",
    sku: "COCA-350",
    name: "Coca Cola 350ml",
    description: "Refresco de cola en lata de 350ml",
    image: "https://placehold.co/200x200/e63946/ffffff?text=Coca+Cola",
    brand: "Coca Cola",
    category: "Bebidas",
    basePrice: 2500,
    unit: "350ml",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp2",
    sku: "PEPSI-350",
    name: "Pepsi 350ml",
    description: "Refresco de cola en lata de 350ml",
    image: "https://placehold.co/200x200/1d3557/ffffff?text=Pepsi",
    brand: "Pepsi",
    category: "Bebidas",
    basePrice: 2300,
    unit: "350ml",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp3",
    sku: "SPRITE-350",
    name: "Sprite 350ml",
    description: "Refresco de lima limón en lata de 350ml",
    image: "https://placehold.co/200x200/52b788/ffffff?text=Sprite",
    brand: "Coca Cola",
    category: "Bebidas",
    basePrice: 2500,
    unit: "350ml",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp4",
    sku: "FANTA-350",
    name: "Fanta Naranja 350ml",
    description: "Refresco de naranja en lata de 350ml",
    image: "https://placehold.co/200x200/f4a261/ffffff?text=Fanta",
    brand: "Coca Cola",
    category: "Bebidas",
    basePrice: 2500,
    unit: "350ml",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp5",
    sku: "AGUA-500",
    name: "Agua Mineral 500ml",
    description: "Agua mineral sin gas",
    image: "https://placehold.co/200x200/457b9d/ffffff?text=Agua",
    brand: "Generic",
    category: "Bebidas",
    basePrice: 1800,
    unit: "500ml",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp6",
    sku: "CHIPS-150",
    name: "Papas Fritas Clásicas 150g",
    description: "Papas fritas con sal",
    image: "https://placehold.co/200x200/d4a373/ffffff?text=Papas",
    brand: "Lay's",
    category: "Snacks",
    basePrice: 4500,
    unit: "150g",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp7",
    sku: "DORITOS-150",
    name: "Doritos Nacho 150g",
    description: "Tortillas de maíz sabor queso nacho",
    image: "https://placehold.co/200x200/e76f51/ffffff?text=Doritos",
    brand: "Doritos",
    category: "Snacks",
    basePrice: 4800,
    unit: "150g",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp8",
    sku: "CHOCO-100",
    name: "Chocolate en Barra 100g",
    description: "Chocolate con leche",
    image: "https://placehold.co/200x200/6f4e37/ffffff?text=Chocolate",
    brand: "Milka",
    category: "Dulces",
    basePrice: 6500,
    unit: "100g",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp9",
    sku: "GALLETAS-200",
    name: "Galletas de Chocolate 200g",
    description: "Galletas con chispas de chocolate",
    image: "https://placehold.co/200x200/a8dadc/ffffff?text=Galletas",
    brand: "Chips Ahoy",
    category: "Dulces",
    basePrice: 5500,
    unit: "200g",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp10",
    sku: "CAFE-250",
    name: "Café Instantáneo 250g",
    description: "Café soluble premium",
    image: "https://placehold.co/200x200/6f4e37/ffffff?text=Cafe",
    brand: "Nescafé",
    category: "Desayuno",
    basePrice: 12500,
    unit: "250g",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp11",
    sku: "LECHE-1L",
    name: "Leche Entera 1L",
    description: "Leche pasteurizada entera",
    image: "https://placehold.co/200x200/f1faee/333333?text=Leche",
    brand: "Algarra",
    category: "Lácteos",
    basePrice: 4800,
    unit: "1L",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gp12",
    sku: "YOGURT-150",
    name: "Yogurt Natural 150g",
    description: "Yogurt natural sin azúcar",
    image: "https://placehold.co/200x200/f1faee/333333?text=Yogurt",
    brand: "Alpina",
    category: "Lácteos",
    basePrice: 3200,
    unit: "150g",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// ============================================================================
// MOCK BUSINESS CATEGORIES
// ============================================================================

export const mockCategories: BusinessCategory[] = [
  {
    id: "cat1",
    name: "Bebidas",
    description: "Todas las bebidas",
    slug: "bebidas",
    industryCategoryId: "ind-cat-1",
    industryCategoryName: "Alimentos y Bebidas",
    businessId: "biz1",
    isActive: true,
    order: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat2",
    name: "Comida Rápida",
    description: "Hamburguesas, perros, etc.",
    slug: "comida-rapida",
    industryCategoryId: "ind-cat-1",
    industryCategoryName: "Alimentos y Bebidas",
    businessId: "biz1",
    isActive: true,
    order: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat3",
    name: "Snacks",
    description: "Papas, chicles, etc.",
    slug: "snacks",
    industryCategoryId: "ind-cat-1",
    industryCategoryName: "Alimentos y Bebidas",
    businessId: "biz1",
    isActive: true,
    order: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat4",
    name: "Postres",
    description: "Helados, tortas, etc.",
    slug: "postres",
    industryCategoryId: "ind-cat-1",
    industryCategoryName: "Alimentos y Bebidas",
    businessId: "biz1",
    isActive: true,
    order: 4,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat5",
    name: "Especiales",
    description: "Productos de la casa",
    slug: "especiales",
    industryCategoryId: "ind-cat-1",
    industryCategoryName: "Alimentos y Bebidas",
    businessId: "biz1",
    isActive: true,
    order: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// ============================================================================
// MOCK BUSINESS PRODUCTS (Mis Productos)
// ============================================================================

export const mockBusinessProducts: BusinessProduct[] = [
  // Products from template
  {
    id: "bp1",
    businessId: "biz1",
    globalProductId: "gp1",
    globalProduct: mockGlobalProducts[0],
    name: "Coca Cola 350ml",
    description: "Refresco de cola en lata",
    price: 2800,
    stock: 100,
    image: null, // Using global product image
    categoryId: "cat1",
    category: mockCategories[0],
    slug: "coca-cola-350ml",
    isActive: true,
    isFeatured: false,
    isFromTemplate: true,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "bp2",
    businessId: "biz1",
    globalProductId: "gp2",
    globalProduct: mockGlobalProducts[1],
    name: "Pepsi 350ml",
    description: "Refresco de cola",
    price: 2500,
    stock: 80,
    image: null,
    categoryId: "cat1",
    category: mockCategories[0],
    slug: "pepsi-350ml",
    isActive: true,
    isFeatured: false,
    isFromTemplate: true,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "bp3",
    businessId: "biz1",
    globalProductId: "gp5",
    globalProduct: mockGlobalProducts[4],
    name: "Agua Mineral",
    description: "Agua sin gas",
    price: 2000,
    stock: 150,
    image: null,
    categoryId: "cat1",
    category: mockCategories[0],
    slug: "agua-mineral",
    isActive: true,
    isFeatured: false,
    isFromTemplate: true,
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "bp4",
    businessId: "biz1",
    globalProductId: "gp6",
    globalProduct: mockGlobalProducts[5],
    name: "Papas Fritas",
    description: "Papas clásicas",
    price: 5000,
    stock: 50,
    image: null,
    categoryId: "cat3",
    category: mockCategories[2],
    slug: "papas-fritas",
    isActive: true,
    isFeatured: false,
    isFromTemplate: true,
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  // Custom products
  {
    id: "bp5",
    businessId: "biz1",
    globalProductId: null,
    globalProduct: null,
    name: "Hamburguesa Especial",
    description: "Carne 150g, queso, tocino, huevo",
    price: 18500,
    stock: 25,
    image: "https://placehold.co/200x200/f97316/ffffff?text=Burger",
    categoryId: "cat2",
    category: mockCategories[1],
    slug: "hamburguesa-especial",
    isActive: true,
    isFeatured: false,
    isFromTemplate: false,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-03-05T00:00:00Z",
  },
  {
    id: "bp6",
    businessId: "biz1",
    globalProductId: null,
    globalProduct: null,
    name: "Perro Caliente Sencillo",
    description: "Salchicha, pan, salsas",
    price: 8500,
    stock: 30,
    image: "https://placehold.co/200x200/f97316/ffffff?text=Hot+Dog",
    categoryId: "cat2",
    category: mockCategories[1],
    slug: "perro-caliente-sencillo",
    isActive: true,
    isFeatured: false,
    isFromTemplate: false,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-03-05T00:00:00Z",
  },
  {
    id: "bp7",
    businessId: "biz1",
    globalProductId: null,
    globalProduct: null,
    name: "Taco Mexicano",
    description: "Tortilla de maíz, carne, guacamole",
    price: 12000,
    stock: 20,
    image: "https://placehold.co/200x200/f97316/ffffff?text=Taco",
    categoryId: "cat2",
    category: mockCategories[1],
    slug: "taco-mexicano",
    isActive: true,
    isFeatured: false,
    isFromTemplate: false,
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "bp8",
    businessId: "biz1",
    globalProductId: null,
    globalProduct: null,
    name: "Helado de Vainilla",
    description: "2 bolas de helado artesanal",
    price: 6500,
    stock: 15,
    image: "https://placehold.co/200x200/ec4899/ffffff?text=Helado",
    categoryId: "cat4",
    category: mockCategories[3],
    slug: "helado-de-vainilla",
    isActive: false, // Inactive product
    isFeatured: false,
    isFromTemplate: false,
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-03-12T00:00:00Z",
  },
  {
    id: "bp9",
    businessId: "biz1",
    globalProductId: null,
    globalProduct: null,
    name: "Combo Familiar",
    description: "4 hamburguesas + 4 bebidas + 2 papas",
    price: 65000,
    stock: 10,
    image: "https://placehold.co/200x200/8b5cf6/ffffff?text=Combo",
    categoryId: "cat5",
    category: mockCategories[4],
    slug: "combo-familiar",
    isActive: true,
    isFeatured: false,
    isFromTemplate: false,
    createdAt: "2024-02-20T00:00:00Z",
    updatedAt: "2024-03-12T00:00:00Z",
  },
];

// ============================================================================
// MOCK SERVICE HELPERS
// ============================================================================

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Get available global products (not yet activated)
export function getAvailableGlobalProducts(
  activatedIds: string[]
): GlobalProduct[] {
  return mockGlobalProducts.filter((gp) => !activatedIds.includes(gp.id));
}

// Simulate server-side filtering
export async function mockFilterProducts(
  products: BusinessProduct[],
  filters: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }
): Promise<BusinessProduct[]> {
  await delay(300); // Simulate network

  return products.filter((p) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.globalProduct?.name.toLowerCase().includes(search);
      if (!matches) return false;
    }

    if (filters.categoryId && p.categoryId !== filters.categoryId) {
      return false;
    }

    if (filters.isActive !== undefined && p.isActive !== filters.isActive) {
      return false;
    }

    return true;
  });
}

// Generate unique ID
export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
