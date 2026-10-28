"use client";

/**
 * Acciones de seguimiento del lead (pestaña Seguimiento de la ficha): el
 * botón que abre el modal de próxima acción, las pendientes (vencidas
 * resaltadas) y las resueltas plegadas. El título va en una sola línea.
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CalendarClock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoLeadAction } from "@/types/auth.types";
import { useDemoLeadActions } from "@/features/admin/demo-leads/hooks/useDemoLeads";
import {
  formatDateTime,
  formatRelative,
  isOverdue,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";
import { LeadActionDialog } from "./LeadActionDialog";

export function LeadActionsSection({
  leadId,
  leadName,
  actions,
}: {
  leadId: string;
  leadName?: string | null;
  actions: DemoLeadAction[];
}) {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const { setDone, remove } = useDemoLeadActions(leadId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mientras se guarda, la casilla ya muestra el estado nuevo.
  const isDone = (action: DemoLeadAction) =>
    setDone.isPending && setDone.variables?.actionId === action.id
      ? setDone.variables.done
      : !!action.doneAt;
  const pending = actions.filter((a) => !isDone(a));
  const resolved = actions.filter((a) => isDone(a));

  const renderAction = (action: DemoLeadAction) => {
    const done = isDone(action);
    const overdue = !done && isOverdue(action.dueAt);
    const busy =
      (setDone.isPending && setDone.variables?.actionId === action.id) ||
      (remove.isPending && remove.variables === action.id);
    return (
      <li
        key={action.id}
        className={cn(
          "group/action flex items-start gap-3 rounded-xl border px-3.5 py-3",
          done
            ? "border-transparent bg-slate-50"
            : overdue
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200/80 bg-white"
        )}
      >
        <input
          type="checkbox"
          checked={done}
          disabled={busy}
          onChange={(e) =>
            setDone.mutate({ actionId: action.id, done: e.target.checked })
          }
          aria-label={done ? t("followUp.markPending") : t("followUp.markDone")}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-indigo-600"
        />
        <div className="min-w-0 flex-1">
          <p
            title={action.title}
            className={cn(
              "truncate text-sm",
              done ? "text-slate-500 line-through" : "font-medium text-slate-900"
            )}
          >
            {action.title}
          </p>
          {(action.dueAt || done) && (
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1 text-xs",
                overdue ? "font-semibold text-amber-800" : "text-slate-500"
              )}
            >
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              )}
              {done
                ? t("followUp.doneAt", {
                    date: formatRelative(action.doneAt, locale),
                  })
                : overdue
                  ? t("followUp.overdue", {
                      date: formatDateTime(action.dueAt, locale),
                    })
                  : formatDateTime(action.dueAt, locale)}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => remove.mutate(action.id)}
          aria-label={t("followUp.delete")}
          className="-m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </li>
    );
  };

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-white text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50/60"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t("card.addAction")}
      </button>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("followUp.pendingTitle", { count: pending.length })}
        </h3>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
            {t("followUp.empty")}
          </p>
        ) : (
          <ul className="space-y-2">{pending.map(renderAction)}</ul>
        )}
      </div>

      {resolved.length > 0 && (
        <details className="border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("followUp.resolvedTitle", { count: resolved.length })}
          </summary>
          <ul className="mt-2 space-y-2">{resolved.map(renderAction)}</ul>
        </details>
      )}

      {isDialogOpen && (
        <LeadActionDialog
          lead={{ id: leadId, name: leadName }}
          isOpen
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </section>
  );
}
