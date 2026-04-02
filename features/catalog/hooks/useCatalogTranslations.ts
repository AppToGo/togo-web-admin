/**
 * Catalog Translations Hook
 *
 * This hook provides translated messages for the catalog hooks.
 * Since mutation hooks can't use useTranslations directly (they're not components),
 * this hook is meant to be used in components and the messages passed to the mutation hooks.
 *
 * @example
 * ```tsx
 * const messages = useCatalogTranslations();
 * const createProduct = useCreateProduct(businessId, messages);
 * ```
 */

import { useTranslations } from "next-intl";

export interface CatalogToastMessages {
  productCreated: string;
  productUpdated: string;
  productDeleted: string;
  productActivated: string;
  productDeactivated: string;
  productActivatedInCatalog: string;
  categoryCreated: string;
  categoryUpdated: string;
  categoryDeleted: string;
  categoryActivated: string;
  categoryDeactivated: string;
  errorCreatingProduct: string;
  errorUpdatingProduct: string;
  errorDeletingProduct: string;
  errorChangingStatus: string;
  errorActivatingProduct: string;
  errorCreatingCategory: string;
  errorUpdatingCategory: string;
  errorDeletingCategory: string;
  bulkUpdateSuccess?: string;
  errorBulkUpdate?: string;
}

export function useCatalogTranslations(): CatalogToastMessages {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");

  return {
    // Success messages
    productCreated: t("notifications.productCreated"),
    productUpdated: t("notifications.productUpdated"),
    productDeleted: t("notifications.productDeleted"),
    productActivated: t("notifications.productActivated"),
    productDeactivated: t("notifications.productDeactivated"),
    productActivatedInCatalog: t("notifications.productActivatedInCatalog"),
    categoryCreated: t("notifications.categoryCreated"),
    categoryUpdated: t("notifications.categoryUpdated"),
    categoryDeleted: t("notifications.categoryDeleted"),
    categoryActivated: t("notifications.categoryActivated"),
    categoryDeactivated: t("notifications.categoryDeactivated"),

    // Error messages
    errorCreatingProduct: tCommon("errors.createFailed"),
    errorUpdatingProduct: tCommon("errors.updateFailed"),
    errorDeletingProduct: tCommon("errors.deleteFailed"),
    errorChangingStatus: tCommon("errors.statusChangeFailed"),
    errorActivatingProduct: tCommon("errors.createFailed"),
    errorCreatingCategory: tCommon("errors.createFailed"),
    errorUpdatingCategory: tCommon("errors.updateFailed"),
    errorDeletingCategory: tCommon("errors.deleteFailed"),
  };
}
