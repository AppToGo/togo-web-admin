/**
 * Branch Inventory Feature
 * 
 * Sistema de gestión de inventario por sede.
 * Permite activar/desactivar productos por sucursal, gestionar stock y precios.
 */

// Types
export * from "./types";

// Services
export * from "./services/branch-inventory.service";

// Hooks
export {
  useBranchInventory,
  useActivateProduct,
  useUpdateInventory,
  useDeactivateProduct,
  useBulkActivate,
  useUpdateStock,
  useSetAvailability,
  useDebouncedInventoryUpdate,
} from "./hooks/useBranchInventory";

// Query keys
export { BRANCH_INVENTORY_KEYS } from "./hooks/query-keys";

// Components
export {
  BranchInventorySelector,
  BranchInventoryTable,
  BulkInventoryActions,
  BranchInventoryManager,
} from "./components";
