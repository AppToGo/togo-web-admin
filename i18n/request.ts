/**
 * i18n Request Configuration
 *
 * Configures next-intl to load messages based on the current locale.
 */

import { getRequestConfig } from "next-intl/server";
import { Locale, defaultLocale, locales } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Determine the locale to use
  let locale = await requestLocale;

  // Validate locale, fallback to default if invalid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  // Now safe to cast after validation
  const validLocale = locale as Locale;

  // Load all message namespaces for the locale
  // Namespaces are preserved to allow getTranslations({ namespace: 'common' }) to work
  const messages = {
    common: (await import(`./messages/${validLocale}/common.json`)).default,
    auth: (await import(`./messages/${validLocale}/auth.json`)).default,
    dashboard: (await import(`./messages/${validLocale}/dashboard.json`)).default,
    orders: (await import(`./messages/${validLocale}/orders.json`)).default,
    catalog: (await import(`./messages/${validLocale}/catalog.json`)).default,
    "admin-catalog": (await import(`./messages/${validLocale}/admin-catalog.json`)).default,
    "admin-businesses": (await import(`./messages/${validLocale}/admin-businesses.json`)).default,
    "admin-industry-categories": (await import(`./messages/${validLocale}/admin-industry-categories.json`)).default,
    settings: (await import(`./messages/${validLocale}/settings.json`)).default,
    navigation: (await import(`./messages/${validLocale}/navigation.json`)).default,
    validation: (await import(`./messages/${validLocale}/validation.json`)).default,
    metadata: (await import(`./messages/${validLocale}/metadata.json`)).default,
    business: (await import(`./messages/${validLocale}/business.json`)).default,
    customers: (await import(`./messages/${validLocale}/customers.json`)).default,
    branches: (await import(`./messages/${validLocale}/branches.json`)).default,
    operatorProfiles: (await import(`./messages/${validLocale}/operatorProfiles.json`)).default,
    userPermissions: (await import(`./messages/${validLocale}/userPermissions.json`)).default,
    users: (await import(`./messages/${validLocale}/users.json`)).default,
    inventory: (await import(`./messages/${validLocale}/inventory.json`)).default,
    subscription: (await import(`./messages/${validLocale}/subscription.json`)).default,
  };

  return {
    locale: validLocale,
    messages,
    timeZone: "America/Bogota",
    now: new Date(),
  };
});
