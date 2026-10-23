"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedStarButtonProps {
  productName: string;
  /** Destacado en la sede del filtro (o en alguna, sin filtro de sede). */
  featured: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Estrella de "Destacar en el catálogo" de las tarjetas de Mis productos.
 * Qué hace el clic (abrir el drawer o quitar el destacado) lo decide la
 * pantalla.
 */
export function FeaturedStarButton({
  productName,
  featured,
  onClick,
  disabled = false,
  className,
}: FeaturedStarButtonProps) {
  const t = useTranslations("catalog.featured");
  const label = featured
    ? t("unfeatureFor", { name: productName })
    : t("featureFor", { name: productName });

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-pressed={featured}
      aria-label={label}
      title={label}
      data-no-select
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
        featured
          ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
          : "text-slate-400 hover:bg-amber-50 hover:text-amber-500",
        className
      )}
    >
      <Star className={cn("h-5 w-5", featured && "fill-current")} />
    </button>
  );
}
