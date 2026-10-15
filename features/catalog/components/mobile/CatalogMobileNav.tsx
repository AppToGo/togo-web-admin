"use client";

/**
 * Barra inferior de Catálogo en el teléfono (< md): Productos · Inventario ·
 * Categorías, como el submenú de Catálogo del Sidebar.
 */

import { useTranslations } from "next-intl";
import { Boxes, Package, Tags } from "lucide-react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function CatalogMobileNav() {
  const t = useTranslations("navigation.sidebar");
  const tc = useTranslations("catalog.mobile.nav");

  return (
    <MobileBottomNav
      label={t("catalog")}
      hiddenFrom="md"
      testId="catalog-mobile-nav"
      items={[
        { href: "/dashboard/catalog/products", label: tc("products"), icon: Package },
        { href: "/dashboard/inventory", label: tc("inventory"), icon: Boxes },
        { href: "/dashboard/catalog/categories", label: tc("categories"), icon: Tags },
      ]}
    />
  );
}
