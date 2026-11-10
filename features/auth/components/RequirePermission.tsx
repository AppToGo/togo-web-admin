"use client";

/**
 * Puerta de sección por permiso: renderiza el contenido solo si el usuario
 * tiene el permiso; mientras carga, un spinner; sin permiso, el mismo panel
 * de "sin permiso" de las páginas (patrón de la página de Caja).
 *
 * Se usa en las secciones que no son para todos: Dashboard (`metrics.view`),
 * Catálogo (`catalog.view`) y Ajustes (`settings.view`).
 */
import { Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { DemoReadOnly } from "@/features/auth/components/DemoReadOnly";

interface RequirePermissionProps {
  code: string;
  /**
   * En una sesión demo la sección se muestra en solo lectura (ver
   * `DemoReadOnly`). Lo usa Configuración.
   */
  demoReadOnly?: boolean;
  children: React.ReactNode;
}

export function RequirePermission({
  code,
  demoReadOnly = false,
  children,
}: RequirePermissionProps) {
  const t = useTranslations("common");
  const { hasPermission, isLoading } = useMyPermissions();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!hasPermission(code)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 text-center max-w-md">
          {t("errors.forbidden")}
        </p>
      </div>
    );
  }

  if (demoReadOnly) return <DemoReadOnly>{children}</DemoReadOnly>;

  return <>{children}</>;
}
