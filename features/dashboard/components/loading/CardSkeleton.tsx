import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Placeholder de tarjeta del dashboard. `bg-muted` del Skeleton base casi
 * no se ve sobre el fondo degradado; acá va blanco translúcido como las glass.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-card-xl bg-white/60", className)} />;
}
