/**
 * Business Management Feature
 * Super Admin business subscription management
 */

// Types
export type {
  BusinessSubscription,
  PaymentRecord,
  BusinessWithSubscription,
  BusinessFilters,
  PaginatedBusinesses,
  UpdateBranchesLimitDto,
  RecordPaymentDto,
  SendNotificationDto,
  PaymentAlert,
} from "./types/business-subscription.types";

// Constants
export {
  DUE_DATE_COLORS,
  PAYMENT_STATUS_CONFIG,
  PLAN_OPTIONS,
  PAYMENT_METHODS,
  NOTIFICATION_TYPES,
  getDueDateSeverity,
  getDueDateColorClass,
  formatDaysUntilDue,
  getPlanLabel,
  getPlanMaxBranches,
} from "./constants/payment-status";

// Services
export {
  getBusinesses,
  getPaymentAlerts,
  updateBranchesLimit,
  recordPayment,
  sendNotification,
  toggleBusinessStatus,
} from "./services/admin-business.service";

// Hooks
export {
  ADMIN_BUSINESS_KEYS,
} from "./hooks/query-keys";

export {
  useBusinesses,
  usePaymentAlerts,
  useUpdateBranchesLimit,
  useRecordPayment,
  useSendNotification,
  useToggleBusinessStatus,
} from "./hooks/useAdminBusinesses";

// Components
export { DueDateBadge } from "./components/DueDateBadge";
export { PaymentStatusBadge } from "./components/PaymentStatusBadge";
export { PlanBadge } from "./components/PlanBadge";
export { FilterPopover } from "./components/FilterPopover";
export { BusinessTable } from "./components/BusinessTable";
export { RecordPaymentModal } from "./components/RecordPaymentModal";
export { EditBranchesLimitModal } from "./components/EditBranchesLimitModal";
export { SendNotificationModal } from "./components/SendNotificationModal";
