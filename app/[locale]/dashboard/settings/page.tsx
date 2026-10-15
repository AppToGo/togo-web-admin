"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsMobileHub } from "@/components/layout/SettingsMobileHub";
import { isBelowDesktopViewport, useIsBelowDesktop } from "@/hooks/useIsMobile";

/**
 * Settings Page
 *
 * En escritorio redirige a Datos del negocio: la navegación de
 * configuración es el submenú del Sidebar. En el teléfono y la tablet
 * (< lg) es la pantalla que agrupa todas las opciones (diseño móvil).
 */
export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isBelowDesktop = useIsBelowDesktop();

  useEffect(() => {
    // Se mira el ancho real, no el hook: en la hidratación el hook todavía
    // devuelve el valor del servidor (escritorio) y redirigiría también en
    // el teléfono.
    // También corre al cruzar a escritorio con la página abierta (girar la
    // tablet): si no, quedaría en blanco.
    if (isBelowDesktopViewport()) return;
    router.replace(`/${locale}/dashboard/settings/general/business`);
  }, [router, locale, isBelowDesktop]);

  if (!isBelowDesktop) return null;

  return (
    <DashboardLayout>
      <SettingsMobileHub />
    </DashboardLayout>
  );
}
