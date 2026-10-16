"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CustomerCard } from "./customer-card";
import type { CustomerWithMetrics } from "../../types";

interface CustomersGridProps {
  data: CustomerWithMetrics[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPageChange: (page: number) => void;
}

/** Botones de paginación: blancos y redondeados como los filtros del header. */
const PAGE_BUTTON = "h-10 rounded-card border-0 bg-white px-4 text-slate-700 shadow-none";

/**
 * Lista de clientes en tarjetas: una columna en el teléfono, dos desde md
 * y tres en pantallas anchas. Sin tabla, así nunca hay scroll horizontal.
 */
export function CustomersGrid({
  data,
  isLoading,
  pagination,
  onPageChange,
}: CustomersGridProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl bg-white/60 md:h-36" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card-xl border border-white/80 bg-white/45 px-4 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <Users className="h-8 w-8 text-indigo-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          {t("empty.title")}
        </h3>
        <p className="max-w-sm text-slate-500">{t("empty.description")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul
        className="grid gap-3 md:grid-cols-2 md:gap-4 2xl:grid-cols-3"
        data-testid="customers-grid"
      >
        {data.map((customer) => (
          <li key={customer.id}>
            <CustomerCard customer={customer} />
          </li>
        ))}
      </ul>

      {pagination.totalPages > 1 && (
        <nav
          aria-label={t("pagination.label")}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-slate-500">
            {t("pagination.showing", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="slate-outline"
              className={PAGE_BUTTON}
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft />
              {tc("pagination.previous")}
            </Button>
            <span className="px-2 text-sm text-slate-600">
              {tc("pagination.pageOf", {
                page: pagination.page,
                totalPages: pagination.totalPages,
              })}
            </span>
            <Button
              variant="slate-outline"
              className={PAGE_BUTTON}
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              {tc("pagination.next")}
              <ChevronRight />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
