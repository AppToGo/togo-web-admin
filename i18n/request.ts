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
  const messages = {
    ...(await import(`./messages/${validLocale}/common.json`)).default,
    ...(await import(`./messages/${validLocale}/auth.json`)).default,
    ...(await import(`./messages/${validLocale}/dashboard.json`)).default,
    ...(await import(`./messages/${validLocale}/orders.json`)).default,
    ...(await import(`./messages/${validLocale}/catalog.json`)).default,
    ...(await import(`./messages/${validLocale}/settings.json`)).default,
    ...(await import(`./messages/${validLocale}/navigation.json`)).default,
    ...(await import(`./messages/${validLocale}/validation.json`)).default,
    ...(await import(`./messages/${validLocale}/metadata.json`)).default,
  };

  return {
    locale: validLocale,
    messages,
    timeZone: "America/Bogota",
    now: new Date(),
  };
});
