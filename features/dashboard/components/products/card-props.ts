import type { ProductMetrics } from '../../types/dashboard.types';

/** Lo que cada tarjeta recibe de `ProductsSection` (una sola consulta). */
export interface ProductCardProps {
  data: ProductMetrics | undefined;
  isError: boolean;
}
