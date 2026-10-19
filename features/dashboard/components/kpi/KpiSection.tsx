"use client";

import { OrdersTodayCard } from "./OrdersTodayCard";
import { PeriodRevenueCard } from "./PeriodRevenueCard";
import { PeriodOrdersCard } from "./PeriodOrdersCard";
import { AverageTicketCard } from "./AverageTicketCard";

/**
 * En el teléfono (2 columnas): Ingresos primero y a todo el ancho, Pedidos de
 * hoy y Ticket lado a lado, Pedidos del período abajo. Desde `md` vuelve al
 * orden de siempre.
 */
export function KpiSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 [&>*>*]:h-full">
      <div className="order-2 md:order-none">
        <OrdersTodayCard />
      </div>
      <div className="order-1 col-span-2 md:order-none md:col-span-1">
        <PeriodRevenueCard />
      </div>
      <div className="order-4 col-span-2 md:order-none md:col-span-1">
        <PeriodOrdersCard />
      </div>
      <div className="order-3 md:order-none">
        <AverageTicketCard />
      </div>
    </div>
  );
}
