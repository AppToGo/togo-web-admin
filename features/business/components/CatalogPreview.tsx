"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Productos de ejemplo: solo para ver colores y tipografía, no son datos reales. */
const SAMPLE_PRODUCTS = [
  { key: "p1", initials: "CC", tone: "bg-amber-200", price: "$ 26.000" },
  { key: "p2", initials: "DQ", tone: "bg-orange-200", price: "$ 32.000" },
  { key: "p3", initials: "PC", tone: "bg-rose-200", price: "$ 24.000" },
] as const;

const HEX = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

interface CatalogPreviewProps {
  name: string;
  description: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  useProductImages: boolean;
}

/**
 * Cómo se ve el catálogo web (togo-web-catalog) con los datos que se están
 * editando: encabezado con el color principal, categoría activa con el de
 * acento, filas de producto y el botón flotante del pedido. Se actualiza en
 * vivo, antes de guardar.
 */
export function CatalogPreview({
  name,
  description,
  logoUrl,
  primaryColor,
  accentColor,
  useProductImages,
}: CatalogPreviewProps) {
  const t = useTranslations("settings.business.preview");
  const primary = HEX.test(primaryColor) ? primaryColor : "#4F46E5";
  const accent = HEX.test(accentColor) ? accentColor : "#10B981";
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      role="img"
      aria-label={t("label", { name: name.trim() || t("namePlaceholder") })}
      className="mx-auto w-[292px] rounded-[40px] bg-slate-900 p-2.5 shadow-[0_14px_40px_rgba(20,20,15,0.18)]"
    >
      <div className="relative h-[520px] overflow-hidden rounded-[30px] bg-[#fbfaf7] text-[#1a1a1a]">
        <div
          className="flex items-center gap-2.5 px-3 pb-2.5 pt-3.5 text-white"
          style={{ background: primary }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[15px] font-bold tracking-tight">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold tracking-tight">
              {name.trim() || t("namePlaceholder")}
            </div>
            <div className="truncate text-[11px] text-white/75">
              {description.trim() || t("descriptionFallback")}
            </div>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12">
            <Search className="h-4 w-4" />
          </span>
        </div>

        <div className="flex gap-1 overflow-hidden whitespace-nowrap border-b border-[#f0f0f0] bg-white px-2.5 py-2 text-xs">
          <span className="rounded-full px-3 py-1 font-semibold text-white" style={{ background: accent }}>
            {t("category1")}
          </span>
          <span className="px-3 py-1 font-medium text-[#4f4f4f]">{t("category2")}</span>
          <span className="px-3 py-1 font-medium text-[#4f4f4f]">{t("category3")}</span>
        </div>

        <div className="bg-white">
          <div className="flex items-baseline gap-1.5 border-b border-[#f0f0f0] px-3 pb-2 pt-2.5">
            <b className="text-[15px] tracking-tight">{t("category1")}</b>
            <span className="text-[11px] font-medium text-[#909090]">
              {t("productCount", { count: SAMPLE_PRODUCTS.length })}
            </span>
          </div>
          {SAMPLE_PRODUCTS.map((product) => (
            <div
              key={product.key}
              className={cn(
                "grid items-center gap-2.5 border-b border-[#f0f0f0] px-3 py-2.5",
                useProductImages ? "grid-cols-[44px_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"
              )}
            >
              {useProductImages && (
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold text-black/50",
                    product.tone
                  )}
                >
                  {product.initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{t(`products.${product.key}.name`)}</div>
                <div className="truncate text-[11px] text-[#909090]">{t(`products.${product.key}.desc`)}</div>
                <div className="mt-0.5 text-[13px] font-bold tracking-tight">{product.price}</div>
              </div>
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-lg font-light leading-none text-white"
                style={{ background: primary }}
              >
                +
              </span>
            </div>
          ))}
        </div>

        <div
          className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-white shadow-[0_14px_40px_rgba(20,20,15,0.14)]"
          style={{ background: primary }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">2</span>
          <span className="flex-1 text-[13px] font-medium opacity-90">{t("viewOrder")}</span>
          <b className="text-sm tracking-tight">$ 58.000</b>
        </div>
      </div>
    </div>
  );
}
