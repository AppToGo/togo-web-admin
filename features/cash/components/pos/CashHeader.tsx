"use client";
/**
 * Encabezado de Caja (docs/caja-pos.md): caja y estado del turno, selector
 * de caja, pestañas con contadores y las acciones del turno (Movimiento,
 * Cerrar caja / Abrir caja).
 */
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCashDateFormat } from "../../utils/cash-time";
import type { CashRegister } from "../../types/cash.types";

export type PosTab =
  "sell" | "receivables" | "settlements" | "shift" | "history" | "audit";

interface CashHeaderProps {
  registers: CashRegister[];
  register: CashRegister | null;
  onSelectRegister: (id: string) => void;
  tabs: Array<{ value: PosTab; label: string; count?: number }>;
  tab: PosTab;
  onTabChange: (tab: PosTab) => void;
  onMovement: (() => void) | null;
  onCloseRegister: (() => void) | null;
  onOpenRegister: (() => void) | null;
}

export function CashHeader({
  registers,
  register,
  onSelectRegister,
  tabs,
  tab,
  onTabChange,
  onMovement,
  onCloseRegister,
  onOpenRegister,
}: CashHeaderProps) {
  const t = useTranslations("cash");
  const fmt = useCashDateFormat();
  const openSession = register?.openSession ?? null;

  return (
    // Menos de 1280 px: caja y acciones arriba, pestañas debajo. Desde
    // 1280 px todo en una fila (el alto de Vender cuenta con eso).
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card-lg border border-white/80 bg-white/40 p-3 backdrop-blur-xl">
      <div className="order-1 flex min-w-0 items-center gap-3 px-2">
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            openSession ? "bg-emerald-600" : "bg-slate-400"
          )}
        />
        <div className="min-w-0">
          {registers.length > 1 ? (
            <Select value={register?.id} onValueChange={onSelectRegister}>
              <SelectTrigger
                aria-label={t("pos.header.register")}
                className="h-8 border-none bg-transparent px-0 font-semibold shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {registers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="font-semibold text-slate-900">{register?.name}</p>
          )}
          <p
            className="truncate text-xs text-slate-500"
            data-testid="pos-session-status"
          >
            {openSession
              ? t("pos.header.open", {
                  name: openSession.openedByName ?? "—",
                  time: fmt.time(openSession.openedAt),
                })
              : t("pos.header.closed")}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t("title")}
        className="order-3 flex w-full gap-1 overflow-x-auto scrollbar-thin xl:order-2 xl:w-auto xl:flex-1 xl:justify-center"
      >
        {tabs.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="order-2 ml-auto flex shrink-0 flex-wrap gap-2 px-1 xl:order-3 xl:ml-0">
        {onMovement && (
          <Button variant="outline" onClick={onMovement}>
            <ArrowLeftRight className="mr-1 h-4 w-4" />
            {t("pos.header.movement")}
          </Button>
        )}
        {onCloseRegister && (
          <Button variant="slate" onClick={onCloseRegister}>
            <Lock className="mr-1 h-4 w-4" />
            {t("actions.closeRegister")}
          </Button>
        )}
        {onOpenRegister && (
          <Button variant="slate" onClick={onOpenRegister}>
            {t("actions.openRegister")}
          </Button>
        )}
      </div>
    </div>
  );
}
