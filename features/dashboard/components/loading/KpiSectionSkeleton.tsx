import { CardSkeleton } from "./CardSkeleton";

/** Mismo grid que `KpiSection`: en el teléfono la primera y la última van a todo el ancho. */
export function KpiSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton
          key={i}
          className={`h-28 md:h-36 ${i === 0 || i === 3 ? "col-span-2 md:col-span-1" : ""}`}
        />
      ))}
    </div>
  );
}
