"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useBusinessFeature } from "../hooks/useBusinessFeatures";
import type { FeatureKey } from "../types";

interface FeaturePageProps {
  name: FeatureKey;
  children: ReactNode;
}

/**
 * Página completa de una funcionalidad: si el negocio no la tiene activa
 * (alguien entra por URL directa), muestra que no está disponible.
 */
export function FeaturePage({ name, children }: FeaturePageProps) {
  const t = useTranslations("business-features");
  const { enabled, isLoading } = useBusinessFeature(name);

  if (isLoading) return null;
  if (enabled) return <>{children}</>;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          {t("unavailable.title")}
        </h2>
        <p className="max-w-md text-center text-slate-500">
          {t("unavailable.description")}
        </p>
      </div>
    </DashboardLayout>
  );
}
