"use client";

/**
 * Barra inferior de Catálogo en el teléfono (< md): Productos · Inventario ·
 * Categorías (· Global), como el submenú de Catálogo del Sidebar.
 */

import { useTranslations } from "next-intl";
import { Boxes, Globe, Package, Tags } from "lucide-react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useShowGlobalCatalog } from "../../hooks/useShowGlobalCatalog";

export function CatalogMobileNav() {
  const t = useTranslations("navigation.sidebar");
  const tc = useTranslations("catalog.mobile.nav");
  const showGlobalCatalog = useShowGlobalCatalog();

  return (
    <MobileBottomNav
      label={t("catalog")}
      hiddenFrom="md"
      testId="catalog-mobile-nav"
      items={[
        { href: "/dashboard/catalog/products", label: tc("products"), icon: Package },
        { href: "/dashboard/inventory", label: tc("inventory"), icon: Boxes },
        { href: "/dashboard/catalog/categories", label: tc("categories"), icon: Tags },
        // Como en el Sidebar: solo si hay productos globales para la industria.
        {
          href: "/dashboard/catalog/global",
          label: tc("global"),
          icon: Globe,
          show: showGlobalCatalog,
        },
      ]}
    />
  );
}
