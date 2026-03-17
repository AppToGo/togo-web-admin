/**
 * i18n Request Configuration
 *
 * Configures next-intl to load messages based on the current locale.
 */

import { getRequestConfig } from "next-intl/server";
import { Locale, defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Determine the locale to use
  let locale = await requestLocale;

  // Fallback to default locale if none specified
  if (!locale) {
    locale = defaultLocale;
  }

  // Load all message namespaces for the locale
  const messages = {
    ...(await import(`./messages/${locale}/common.json`)).default,
    ...(await import(`./messages/${locale}/auth.json`)).default,
    ...(await import(`./messages/${locale}/dashboard.json`)).default,
    ...(await import(`./messages/${locale}/orders.json`)).default,
    ...(await import(`./messages/${locale}/catalog.json`)).default,
    ...(await import(`./messages/${locale}/settings.json`)).default,
    ...(await import(`./messages/${locale}/navigation.json`)).default,
    ...(await import(`./messages/${locale}/validation.json`)).default,
  };

  return {
    locale: locale as Locale,
    messages,
    timeZone: "America/Bogota",
    now: new Date(),
  };
});
