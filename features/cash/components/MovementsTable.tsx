"use client";
/**
 * Tabla de movimientos del turno (solo lectura: el ledger es append-only).
 * Variante drawer reutilizable para el "Recorrido del dinero" del pedido.
 */
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "../utils/cash.utils";
import type { CashMovement } from "../types/cash.types";

function directionClass(direction: CashMovement["direction"]): string {
  return direction === "IN" ? "text-emerald-600" : "text-red-600";
}

export function MovementsTable({ movements }: { movements: CashMovement[] }) {
  const t = useTranslations("cash");

  if (movements.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{t("movements.empty")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{t("summary.movements")}</TableHead>
          <TableHead>{t("collections.order")}</TableHead>
          <TableHead className="text-right">{t("movements.amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="text-xs text-slate-400">{movement.sequence}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="w-fit">
                  {t(`movements.types.${movement.type}`)}
                </Badge>
                {movement.notes && (
                  <span className="text-xs text-slate-500">{movement.notes}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm">
              {movement.order?.orderNumber != null
                ? `#${movement.order.orderNumber}`
                : "—"}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${directionClass(movement.direction)}`}
            >
              {movement.direction === "IN" ? "+" : "−"}
              {formatCOP(movement.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
