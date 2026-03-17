"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocaleStore } from "@/stores/localeStore";
import { locales, localeLabels, localeFlags } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { setUserPreference } = useLocaleStore();

  const handleChange = (newLocale: Locale) => {
    setUserPreference(newLocale);
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="mr-1">{localeFlags[currentLocale as Locale]}</span>
          <span className="hidden sm:inline">
            {localeLabels[currentLocale as Locale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleChange(locale)}
            className={`gap-2 cursor-pointer ${
              currentLocale === locale ? "bg-accent" : ""
            }`}
          >
            <span>{localeFlags[locale]}</span>
            <span>{localeLabels[locale]}</span>
            {currentLocale === locale && (
              <span className="ml-auto text-xs text-muted-foreground">
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple version with buttons for inline use
export function LanguageSwitcherButtons() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { setUserPreference } = useLocaleStore();

  const handleChange = (newLocale: Locale) => {
    setUserPreference(newLocale);
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors
            ${
              currentLocale === locale
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          aria-label={`Switch to ${localeLabels[locale]}`}
        >
          <span className="mr-1">{localeFlags[locale]}</span>
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
