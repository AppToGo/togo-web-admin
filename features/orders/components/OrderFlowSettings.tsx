"use client";

import { useTranslations } from "next-intl";
import { Workflow } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import {
  useBusinessOrderFlow,
  useUpdateBusinessOrderFlow,
} from "../hooks/useOrderFlow";
import type { OrderStatus } from "../types";
import { HoverTooltip } from "./HoverTooltip";

/** Estados del flujo que el negocio puede dejar de usar. */
const OPTIONAL_STATUSES: OrderStatus[] = ["IN_PROGRESS", "READY"];

/** Quién decide el flujo del negocio (el backend aplica la misma regla). */
const FLOW_EDITOR_ROLES = ["OWNER", "ADMIN", "SUPER_ADMIN"];

/**
 * Flujo del tablero del negocio: qué estados usa su operación. Es igual para
 * todos los usuarios; solo OWNER/ADMIN lo cambian. Un estado que no se usa
 * desaparece del tablero y los pedidos lo saltan.
 */
export function OrderFlowSettings() {
  const t = useTranslations("orders");
  const user = useCurrentUser();
  const { data: flow } = useBusinessOrderFlow();
  const updateFlow = useUpdateBusinessOrderFlow();

  if (!user || !FLOW_EDITOR_ROLES.includes(user.role)) return null;

  const skipped = flow?.skippedStatuses ?? [];
  const toggle = (status: OrderStatus, used: boolean) => {
    const next = used
      ? skipped.filter((s) => s !== status)
      : [...skipped, status];
    updateFlow.mutate(next);
  };

  return (
    <Popover>
      <HoverTooltip content={t("orderFlow.title")} side="bottom">
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("orderFlow.title")}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-card transition-all duration-200",
              // Resaltado como el botón de filtros: el flujo no es el de fábrica.
              skipped.length > 0
                ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Workflow className="w-4 h-4" />
          </button>
        </PopoverTrigger>
      </HoverTooltip>
      <PopoverContent align="end" className="w-72 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-sm text-slate-900">
            {t("orderFlow.title")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("orderFlow.description")}
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            {OPTIONAL_STATUSES.map((status) => {
              const used = !skipped.includes(status);
              return (
                <label
                  key={status}
                  className="group flex items-center justify-between gap-3 cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                >
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {t(`status.${status}`)}
                  </span>
                  <Switch
                    checked={used}
                    disabled={!flow || updateFlow.isPending}
                    onCheckedChange={(checked) => toggle(status, checked)}
                    aria-label={t(`status.${status}`)}
                  />
                </label>
              );
            })}
          </div>
          <div className="h-px bg-slate-100" />
          <p className="text-xs text-slate-500">{t("orderFlow.alwaysOn")}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
