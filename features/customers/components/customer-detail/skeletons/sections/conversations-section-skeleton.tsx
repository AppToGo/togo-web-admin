"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder de la lista de conversaciones: filas en tarjeta, como la lista real. */
export function ConversationsSectionSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-[20px] bg-white/60" />
      ))}
    </div>
  );
}
