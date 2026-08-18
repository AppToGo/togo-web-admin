/**
 * Metadata helpers for the permission catalog UI.
 *
 * The API's `PermissionCatalog.description` is a short technical label
 * ("Ver pedidos"), not an end-user explanation, and the catalog is not
 * fully wired to enforcement yet (see NON_OPERATIONAL_PERMISSIONS below).
 * Human-readable labels/descriptions live in i18n (`permissionCatalog`
 * namespace) instead of the API, since they don't require a migration
 * and can be localized (ES/EN).
 *
 * Audited against api-togo (@RequirePermissions decorators, the Business
 * Action Engine, and service-level checks) on 2026-08-18.
 */

/**
 * Permission codes that exist in `permission_catalog` but are not enforced
 * anywhere in the API today (no guard, no action, no service check).
 * Toggling them currently has zero effect on behavior.
 *
 * These are hidden from regular users (to avoid the false impression that
 * they restrict something) and shown to SUPER_ADMIN with a "non-operational"
 * badge, so the pending backend work stays visible.
 */
export const NON_OPERATIONAL_PERMISSIONS: ReadonlySet<string> = new Set([
  "order.edit_items",
  "payment.view",
  "payment.confirm",
  "delivery.assign_self",
  "delivery.view_route",
  "product.view",
  "product.create",
  "product.update",
  "product.delete",
  "customer.address.view",
  "customer.address.create",
  "customer.address.update",
  "customer.address.delete",
  "profile.assign_permissions",
  "business_ops.manage_operator_profiles",
  "business_ops.manage_users",
  "whatsapp.connect",
  "whatsapp.disconnect",
  "whatsapp.view_status",
  "whatsapp.send_message",
]);

/**
 * Converts a permission code (`order.change_status`) into a valid i18n key
 * (`order_change_status`). Dots would otherwise be read by next-intl as
 * nested message paths.
 */
export function permissionI18nKey(code: string): string {
  return code.replace(/\./g, "_");
}

export function isNonOperational(code: string): boolean {
  return NON_OPERATIONAL_PERMISSIONS.has(code);
}
