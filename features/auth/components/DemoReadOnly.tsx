"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { ReadOnlyProvider } from "@/components/ui/read-only";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * En una sesión demo, el contenido se muestra en solo lectura: aviso arriba
 * y los controles deshabilitados (ver `ReadOnlyProvider`). Fuera de la demo
 * no cambia nada. El backend igual rechaza cualquier cambio de la demo
 * (DemoModeGuard); esto evita que el visitante lo descubra al guardar.
 */
export function DemoReadOnly({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const isDemo = useCurrentUser()?.isDemo === true;

  if (!isDemo) return <>{children}</>;

  return (
    <ReadOnlyProvider>
      <Alert className="mb-4 border-indigo-200 bg-indigo-50 text-indigo-900">
        <Eye className="h-4 w-4" />
        <AlertTitle>{t("demoReadOnly.title")}</AlertTitle>
        <AlertDescription>{t("demoReadOnly.description")}</AlertDescription>
      </Alert>
      {children}
    </ReadOnlyProvider>
  );
}
