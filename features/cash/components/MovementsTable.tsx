"use client";
/**
 * Tabla de movimientos del turno (solo lectura: el ledger es append-only).
 * Hora, concepto, responsable y monto, como en el prototipo acordado.
 */
import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCOP } from "../utils/cash.utils";
import type { CashMovement } from "../types/cash.types";

type Translate = ReturnType<typeof useTranslations>;

function conceptTitle(movement: CashMovement, t: Translate): string {
  const number = movement.order?.orderNumber;
  let base: string;
  switch (movement.type) {
    case "ORDER_PAYMENT":
      base =
        number != null
          ? t("concept.orderPayment", { number })
          : t("concept.orderPaymentNoNumber");
      break;
    case "SETTLEMENT":
      base =
        number != null
          ? t("concept.settlementOrder", { number })
          : t("concept.settlement");
      break;
    case "REFUND":
      base =
        number != null ? t("concept.refundOrder", { number }) : t("concept.refund");
      break;
    case "MANUAL_IN":
      base = t("concept.manualIn");
      break;
    case "MANUAL_OUT":
      base = t("concept.manualOut");
      break;
    default:
      base = t("concept.withdrawal");
  }
  return movement.category
    ? t("concept.withCategory", { type: base, category: movement.category })
    : base;
}

function conceptDetail(movement: CashMovement, t: Translate): string | null {
  if (movement.type === "ORDER_PAYMENT") {
    const change = Number(movement.changeAmount ?? 0);
    if (movement.receivedAmount != null && change > 0) {
      return t("concept.receivedChange", {
        received: formatCOP(movement.receivedAmount),
        change: formatCOP(change),
      });
    }
    return movement.notes ?? t("concept.exact");
  }
  return movement.notes;
}

export function MovementsTable({ movements }: { movements: CashMovement[] }) {
  const t = useTranslations("cash");
  const locale = useLocale();

  if (movements.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">{t("movements.empty")}</p>
    );
  }

  const headClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <Table className="min-w-[560px]">
      <TableHeader className="[&_tr]:border-slate-300/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className={headClass}>{t("table.time")}</TableHead>
          <TableHead className={headClass}>{t("table.concept")}</TableHead>
          <TableHead className={headClass}>{t("table.responsible")}</TableHead>
          <TableHead className={cn(headClass, "text-right")}>{t("table.amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => {
          const detail = conceptDetail(movement, t);
          return (
            <TableRow
              key={movement.id}
              className="border-slate-300/50 hover:bg-white/40"
            >
              <TableCell className="whitespace-nowrap tabular-nums text-slate-600">
                {new Date(movement.createdAt).toLocaleTimeString(locale, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>
                <p className="font-medium text-slate-900">{conceptTitle(movement, t)}</p>
                {detail && <p className="text-xs text-slate-500">{detail}</p>}
              </TableCell>
              <TableCell className="text-slate-600">
                {movement.createdByName ?? "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "whitespace-nowrap text-right font-semibold tabular-nums",
                  movement.direction === "IN" ? "text-emerald-700" : "text-red-700"
                )}
              >
                {movement.direction === "IN" ? "+ " : "− "}
                {formatCOP(movement.amount)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
