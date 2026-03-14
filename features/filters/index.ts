/**
 * Filters Feature
 *
 * Sistema de filtros globales para sincronizar Dashboard y Órdenes.
 */

// Stores
export {
  useDateFilterStore,
  useDateFilterRange,
  useDateFilterPreset,
  useDateFilterActions,
} from "./stores";

export type {
  DateFilterPreset,
  DateRange,
  DateFilterState,
  DateFilterActions,
} from "./stores";

// Hooks
export {
  useDateFilterQuery,
  useDateFilterParams,
  useDateFilterKey,
  useHasDateFilter,
  useDateFilterDays,
} from "./hooks";

// Components
export { DateRangeFilter } from "./components";
