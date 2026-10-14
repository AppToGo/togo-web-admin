"use client";
/**
 * Caja en el teléfono y la tablet (< lg), según el diseño móvil: las
 * pestañas y las acciones del encabezado pasan a una barra fija abajo
 * (Vender · Por cobrar · Por liquidar · Más). "Más" agrupa Turno, Historial
 * y Auditoría con las acciones del turno (movimiento, cerrar o abrir caja).
 */
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  Bike,
  Lock,
  MoreHorizontal,
  ReceiptText,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PosTab } from "./CashHeader";

/** Pestañas que viven dentro de "Más" en el teléfono. */
export const MORE_TABS: PosTab[] = ["shift", "history", "audit"];

interface CashBottomNavProps {
  tab: PosTab;
  onTabChange: (tab: PosTab) => void;
  canSell: boolean;
  canViewOrders: boolean;
  receivablesCount: number;
  settlementsCount: number;
}

export function CashBottomNav({
  tab,
  onTabChange,
  canSell,
  canViewOrders,
  receivablesCount,
  settlementsCount,
}: CashBottomNavProps) {
  const t = useTranslations("cash");
  const items: Array<{
    value: PosTab;
    label: string;
    icon: LucideIcon;
    count?: number;
    active: boolean;
    show: boolean;
  }> = [
    {
      value: "sell",
      label: t("pos.tabs.sell"),
      icon: ShoppingBag,
      active: tab === "sell",
      show: canSell,
    },
    {
      value: "receivables",
      label: t("pos.tabs.receivables"),
      icon: ReceiptText,
      count: receivablesCount,
      active: tab === "receivables",
      show: canViewOrders,
    },
    {
      value: "settlements",
      label: t("pos.tabs.settlements"),
      icon: Bike,
      count: settlementsCount,
      active: tab === "settlements",
      show: true,
    },
    {
      value: "shift",
      label: t("pos.mobile.more"),
      icon: MoreHorizontal,
      active: MORE_TABS.includes(tab),
      show: true,
    },
  ];
  const visible = items.filter((item) => item.show);

  return (
    <nav
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      data-testid="cash-bottom-nav"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
      >
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              type="button"
              aria-current={item.active ? "page" : undefined}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                item.active ? "text-indigo-700" : "text-slate-500"
              )}
            >
              <Icon className="h-[22px] w-[22px]" />
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute left-1/2 top-2 ml-2 min-w-[18px] rounded-full bg-indigo-600 px-1 text-[11px] font-bold leading-[18px] text-white tabular-nums">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface CashMoreMenuProps {
  tab: PosTab;
  onTabChange: (tab: PosTab) => void;
  canAudit: boolean;
  onMovement: (() => void) | null;
  onCloseRegister: (() => void) | null;
  onOpenRegister: (() => void) | null;
}

/** Cabecera de "Más" en el teléfono: Turno · Historial · Auditoría y acciones. */
export function CashMoreMenu({
  tab,
  onTabChange,
  canAudit,
  onMovement,
  onCloseRegister,
  onOpenRegister,
}: CashMoreMenuProps) {
  const t = useTranslations("cash");
  const sections: Array<{ value: PosTab; label: string; show: boolean }> = [
    { value: "shift", label: t("pos.tabs.shift"), show: true },
    { value: "history", label: t("tabs.history"), show: true },
    { value: "audit", label: t("tabs.audit"), show: canAudit },
  ];

  return (
    <div className="space-y-3 lg:hidden">
      <div
        role="tablist"
        aria-label={t("pos.mobile.more")}
        className="grid gap-1 rounded-card bg-slate-200/60 p-1"
        style={{
          gridTemplateColumns: `repeat(${sections.filter((s) => s.show).length}, minmax(0, 1fr))`,
        }}
      >
        {sections
          .filter((section) => section.show)
          .map((section) => (
            <button
              key={section.value}
              type="button"
              role="tab"
              aria-selected={tab === section.value}
              onClick={() => onTabChange(section.value)}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition-colors",
                tab === section.value
                  ? "bg-white text-indigo-700 shadow-card-sm"
                  : "text-slate-600"
              )}
            >
              {section.label}
            </button>
          ))}
      </div>
      {(onMovement || onCloseRegister || onOpenRegister) && (
        <div className="grid grid-cols-2 gap-2">
          {onMovement && (
            <Button variant="outline" className="h-11" onClick={onMovement}>
              <ArrowLeftRight className="mr-1 h-4 w-4" />
              {t("pos.header.movement")}
            </Button>
          )}
          {onCloseRegister && (
            <Button variant="slate" className="h-11" onClick={onCloseRegister}>
              <Lock className="mr-1 h-4 w-4" />
              {t("actions.closeRegister")}
            </Button>
          )}
          {onOpenRegister && (
            <Button variant="slate" className="col-span-2 h-11" onClick={onOpenRegister}>
              {t("actions.openRegister")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
