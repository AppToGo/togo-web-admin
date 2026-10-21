"use client";

/**
 * Barra superior en móvil y tablet (< lg): botón de menú a la izquierda y
 * el nombre de la sección donde está el usuario. En escritorio el sidebar
 * siempre está visible y esta barra no se muestra.
 */

import { useTranslations } from "next-intl";
import { ChevronLeft, Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Ruta → clave de `navigation.sidebar`. Gana el prefijo más largo. */
const SECTIONS: Array<[string, string]> = [
  ["/dashboard/orders", "orders"],
  ["/dashboard/cash", "cash"],
  ["/dashboard/customers", "customers"],
  ["/dashboard/inbox", "inbox"],
  ["/dashboard/conversation-funnel", "conversationFunnel"],
  ["/dashboard/conversations", "conversations"],
  ["/dashboard/catalog/products", "myProducts"],
  ["/dashboard/catalog/categories", "categories"],
  ["/dashboard/catalog/global", "globalCatalog"],
  ["/dashboard/catalog", "catalog"],
  ["/dashboard/inventory", "inventory"],
  ["/dashboard/branches", "branches"],
  ["/dashboard/settings/users", "users"],
  ["/dashboard/settings/operator-profiles", "operatorProfiles"],
  ["/dashboard/settings/notifications", "notifications"],
  ["/dashboard/settings/billing", "billing"],
  ["/dashboard/settings", "settings"],
  ["/dashboard/users", "users"],
  ["/admin/businesses", "businesses"],
  ["/admin/global-products", "globalCatalog"],
  ["/admin/industry-categories", "industryCategories"],
  ["/admin/demo-leads", "demoLeads"],
  ["/admin/ai-usage", "aiUsage"],
  ["/dashboard", "dashboard"],
];

/**
 * Subpantallas de Configuración (diseño móvil): la barra muestra volver a su
 * pantalla padre en vez del menú. Gana el prefijo más largo; el título sale
 * de `navigation.sidebar`.
 */
const BACK_ROUTES: Array<{ prefix: string; parent: string; key: string }> = [
  {
    prefix: "/dashboard/settings/general/business",
    parent: "/dashboard/settings",
    key: "business",
  },
  {
    prefix: "/dashboard/settings/general/bot-messages",
    parent: "/dashboard/settings",
    key: "botMessages",
  },
  {
    prefix: "/dashboard/settings/users",
    parent: "/dashboard/settings",
    key: "users",
  },
  {
    prefix: "/dashboard/users",
    parent: "/dashboard/settings/users",
    key: "users",
  },
  {
    prefix: "/dashboard/settings/operator-profiles",
    parent: "/dashboard/settings",
    key: "operatorProfiles",
  },
  {
    prefix: "/dashboard/settings/operator-profiles/",
    parent: "/dashboard/settings/operator-profiles",
    key: "operatorProfiles",
  },
  {
    prefix: "/dashboard/settings/notifications",
    parent: "/dashboard/settings",
    key: "notifications",
  },
  {
    prefix: "/dashboard/settings/billing",
    parent: "/dashboard/settings",
    key: "billing",
  },
  {
    prefix: "/dashboard/branches",
    parent: "/dashboard/settings",
    key: "branches",
  },
  {
    prefix: "/dashboard/branches/",
    parent: "/dashboard/branches",
    key: "branches",
  },
];

export function backRouteFor(pathname: string) {
  // Sin la barra final (trailingSlash): "/x/" y "/x" son la misma pantalla.
  const path = pathname.replace(/\/+$/, "");
  return (
    BACK_ROUTES.filter(({ prefix }) =>
      // Prefijo con "/" final: solo sus pantallas hijas, no la lista.
      prefix.endsWith("/")
        ? path.startsWith(prefix)
        : path === prefix || path.startsWith(`${prefix}/`)
    ).sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null
  );
}

export function sectionKeyFor(pathname: string): string | null {
  const match = SECTIONS.filter(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  ).sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] ?? null;
}

interface MobileTopBarProps {
  onMenuClick: () => void;
  menuOpen: boolean;
}

export function MobileTopBar({ onMenuClick, menuOpen }: MobileTopBarProps) {
  const t = useTranslations("navigation.sidebar");
  const pathname = usePathname();
  const back = backRouteFor(pathname);
  const key = back?.key ?? sectionKeyFor(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 lg:hidden",
        "h-14 flex items-center gap-1 pl-1 pr-4",
        "bg-white/85 backdrop-blur-xl border-b border-slate-200/70"
      )}
    >
      {back ? (
        <Link
          href={back.parent}
          aria-label={t("back")}
          className="w-11 h-11 rounded-card flex items-center justify-center text-slate-700 hover:bg-slate-100"
          data-testid="mobile-back"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t("openMenu")}
          aria-expanded={menuOpen}
          className="w-11 h-11 rounded-card flex items-center justify-center text-slate-700 hover:bg-slate-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
      {key && (
        <span
          className="text-lg font-bold text-slate-900 truncate"
          data-testid="mobile-section-title"
        >
          {t(key)}
        </span>
      )}
    </header>
  );
}
