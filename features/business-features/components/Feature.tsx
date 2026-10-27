"use client";

import type { ReactNode } from "react";
import { useBusinessFeature } from "../hooks/useBusinessFeatures";
import type { FeatureKey } from "../types";

interface FeatureProps {
  name: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Muestra su contenido solo si el negocio tiene activa la funcionalidad.
 * Mientras carga no muestra nada, igual que <Can>.
 */
export function Feature({ name, children, fallback = null }: FeatureProps) {
  const { enabled, isLoading } = useBusinessFeature(name);
  if (isLoading) return null;
  return <>{enabled ? children : fallback}</>;
}
