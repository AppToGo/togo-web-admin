"use client";

import { useTranslations } from "next-intl";
import { Eye, EyeOff, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "../loading/CardSkeleton";
import { DashboardCardHeader } from "../DashboardCardHeader";
import {
  useProductReviewsSummary,
  useToggleReviewHidden,
} from "../../hooks/useProductReviews";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import type {
  ProductReviewsSummary,
  RatedProduct,
} from "../../types/dashboard.types";

/** Mismo mínimo que la API para entrar al ranking (MIN_PUBLIC_RATINGS). */
const MIN_RATINGS_FOR_RANKING = 3;

/**
 * Calificaciones de los clientes (flag PRODUCT_REVIEWS): promedio y
 * distribución, mejor y peor calificados, y las opiniones recientes con
 * la opción de ocultarlas del catálogo.
 */
export function ProductReviewsCard() {
  const t = useTranslations("dashboard.reviews");
  const { data, isLoading, isError } = useProductReviewsSummary();

  if (isLoading) return <CardSkeleton className="h-80" />;

  return (
    <Card variant="glass" className="flex flex-col">
      <DashboardCardHeader
        icon={Star}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <CardContent>
        {isError || !data ? (
          <p className="text-sm text-slate-500">{t("error")}</p>
        ) : data.total === 0 && data.recent.length === 0 ? (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Distribution data={data} />
            <Ranking data={data} />
            <RecentReviews data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-500" aria-hidden="true">
      {"★".repeat(Math.round(value))}
      <span className="text-slate-300">
        {"★".repeat(5 - Math.round(value))}
      </span>
    </span>
  );
}

function Distribution({ data }: { data: ProductReviewsSummary }) {
  const t = useTranslations("dashboard.reviews");
  const max = Math.max(1, ...data.distribution.map((d) => d.count));

  return (
    <section>
      <p className="text-3xl font-bold tabular-nums text-slate-900">
        {data.average != null
          ? data.average.toLocaleString("es-CO", { minimumFractionDigits: 1 })
          : "—"}
        <span className="ml-2 text-base">
          <Stars value={data.average ?? 0} />
        </span>
      </p>
      <p className="mb-3 text-sm text-slate-500">
        {t("total", { count: data.total })}
      </p>
      <ul className="space-y-1.5">
        {[...data.distribution].reverse().map(({ stars, count }) => (
          <li
            key={stars}
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <span className="w-6 tabular-nums">{stars}★</span>
            <div className="h-1.5 flex-1 rounded-full bg-amber-100/70">
              <div
                className="h-1.5 rounded-full bg-amber-400"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Ranking({ data }: { data: ProductReviewsSummary }) {
  const t = useTranslations("dashboard.reviews");
  const { best, worst } = data;

  const list = (title: string, rows: RatedProduct[]) => (
    <div>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="space-y-1.5">
        {rows.map((p) => (
          <li
            key={p.productId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="truncate text-slate-800">{p.name}</span>
            <span className="shrink-0 tabular-nums text-slate-600">
              ★{" "}
              {p.ratingAvg?.toLocaleString("es-CO", {
                minimumFractionDigits: 1,
              })}{" "}
              <span className="text-xs text-slate-400">({p.ratingCount})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="space-y-4">
      {best.length === 0 ? (
        <p className="text-sm text-slate-500">
          {t("rankingPending", { min: MIN_RATINGS_FOR_RANKING })}
        </p>
      ) : (
        <>
          {list(t("best"), best)}
          {worst.length > 0 && list(t("worst"), worst)}
        </>
      )}
    </section>
  );
}

function RecentReviews({ data }: { data: ProductReviewsSummary }) {
  const t = useTranslations("dashboard.reviews");
  const toggle = useToggleReviewHidden();
  // Mismo permiso que el endpoint de ocultar/mostrar.
  const { hasPermission } = useMyPermissions();
  const canToggle = hasPermission("product.update");

  return (
    <section>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-700">
        {t("recent")}
      </h3>
      {data.recent.length === 0 ? (
        <p className="text-sm text-slate-500">{t("noComments")}</p>
      ) : (
        <ul className="space-y-3">
          {data.recent.map((review) => (
            <li
              key={review.id}
              className={review.hidden ? "opacity-50" : undefined}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">
                  <Stars value={review.rating} /> · {review.productName} · #
                  {review.orderNumber}
                </span>
                {canToggle && (
                  <button
                    type="button"
                    onClick={() =>
                      toggle.mutate({ id: review.id, hidden: !review.hidden })
                    }
                    disabled={toggle.isPending}
                    className="inline-flex shrink-0 items-center gap-1 rounded-badge px-1.5 py-0.5 text-slate-500 hover:bg-white/70 hover:text-slate-800"
                    aria-label={review.hidden ? t("show") : t("hide")}
                    title={review.hidden ? t("show") : t("hide")}
                  >
                    {review.hidden ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-800">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
