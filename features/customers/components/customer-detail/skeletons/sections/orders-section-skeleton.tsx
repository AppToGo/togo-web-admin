"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder de la lista de pedidos: filas en tarjeta, como la lista real. */
export function OrdersSectionSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-[20px] bg-white/60" />
      ))}
    </div>
  );
}
