import type { ProductSales } from '../../types/dashboard.types';

/**
 * Misma clave que la API (`get-product-metrics.handler.ts`): los productos
 * de texto libre (sin catálogo) se identifican por nombre con prefijo, para
 * que no choquen con un `productId`.
 */
export const productKey = (row: Pick<ProductSales, 'productId' | 'name'>) =>
  row.productId ?? `name:${row.name}`;
