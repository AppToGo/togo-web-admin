import { generateSlug } from "@/features/catalog/utils/slug";
import type { CatalogProduct, ProductVariant } from "@/features/catalog/types/catalog.types";
import type { ImportItem } from "../types/import.types";

// Fallback label when an ImportItem has only a flat price and no detected variants
export const IMPORT_DEFAULT_VARIANT_LABEL = "Unidad";

export function importItemToCatalogProduct(item: ImportItem): CatalogProduct {
  let variants: ProductVariant[];

  if (item.variants && item.variants.length > 0) {
    // Use real variants detected by the import pipeline
    variants = item.variants.map((v, i) => ({
      id: `${item.id}-variant-${i}`,
      productId: item.id,
      businessId: item.businessId,
      variantLabel: v.variantLabel,
      price: v.suggestedPrice ?? 0,
      isActive: true,
      isDefault: i === 0,
      attributes: {},
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  } else if (item.price !== null) {
    // Flat-price product: create a single synthetic variant for display
    variants = [
      {
        id: `${item.id}-variant`,
        productId: item.id,
        businessId: item.businessId,
        variantLabel: IMPORT_DEFAULT_VARIANT_LABEL,
        price: item.price,
        isActive: true,
        isDefault: true,
        attributes: {},
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    ];
  } else {
    variants = [];
  }

  const prices = variants.map((v) => v.price).filter((p) => p > 0);
  const priceFrom = prices.length > 0 ? Math.min(...prices) : undefined;
  const priceTo = prices.length > 0 ? Math.max(...prices) : undefined;

  return {
    id: item.id,
    businessId: item.businessId,
    name: item.name,
    slug: generateSlug(item.name) || item.id.slice(0, 20),
    description: item.description ?? undefined,
    image: item.imageUrl ?? undefined,
    kind: variants.length > 1 ? "CONFIGURABLE" : "SIMPLE",
    isActive: true,
    isFeatured: false,
    variantCount: variants.length,
    priceFrom,
    priceTo,
    variants,
    businessCategoryId: item.businessCategoryId ?? undefined,
    industryCategoryId: item.industryCategoryId ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
