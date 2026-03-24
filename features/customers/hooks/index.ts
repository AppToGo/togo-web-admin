export {
  useCustomers,
  CUSTOMERS_KEYS,
  STALE_TIME,
  GC_TIME,
} from "./useCustomers";

export {
  useCustomer,
  useCustomerMetrics,
  useCustomerOrders,
} from "./useCustomer";

export { useUpdateCustomer } from "./useCustomerMutations";

export { useGlobalCustomerMetrics } from "./useGlobalCustomerMetrics";

// Nuevos hooks para lazy loading
export { useIntersectionObserver } from "./useIntersectionObserver";
export { useLazySection } from "./useLazySection";
