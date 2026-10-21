"use client";

/**
 * Acciones de seguimiento del lead: la lista (pendientes primero, luego
 * resueltas) con su casilla para resolver y su botón de eliminar, y debajo
 * los campos para agregar la próxima acción con su fecha.
 */

import * as React from "react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import type { DemoLeadAction } from "@/types/auth.types";
import { useDemoLeadActions } from "@/features/admin/demo-leads/hooks/useDemoLeads";
import {
  formatDateTime,
  formatRelative,
  isOverdue,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

export function LeadActionsSection({
  leadId,
  actions,
}: {
  leadId: string;
  actions: DemoLeadAction[];
}) {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const { add, setDone, remove } = useDemoLeadActions(leadId);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    add.mutate(
      { title: text, ...(dueAt ? { dueAt } : {}) },
      {
        onSuccess: () => {
          setTitle("");
          setDueAt("");
        },
      }
    );
  };

  const pending = actions.filter((a) => !a.doneAt).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {t("followUp.title")}
        </h3>
        {actions.length > 0 && (
          <span className="text-xs text-slate-500">
            {t("followUp.pendingCount", { count: pending })}
          </span>
        )}
      </div>

      {actions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          {t("followUp.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((action) => {
            // Mientras se guarda, la casilla ya muestra el estado nuevo.
            const toggling =
              setDone.isPending && setDone.variables?.actionId === action.id;
            const done = toggling ? setDone.variables.done : !!action.doneAt;
            const overdue = !done && isOverdue(action.dueAt);
            const busy =
              toggling || (remove.isPending && remove.variables === action.id);
            return (
              <li
                key={action.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-3.5 py-3",
                  done
                    ? "border-slate-100 bg-slate-50/60"
                    : overdue
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white"
                )}
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={busy}
                  onChange={(e) =>
                    setDone.mutate({
                      actionId: action.id,
                      done: e.target.checked,
                    })
                  }
                  aria-label={
                    done ? t("followUp.markPending") : t("followUp.markDone")
                  }
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      done
                        ? "text-slate-500 line-through"
                        : "font-medium text-slate-900"
                    )}
                  >
                    {action.title}
                  </p>
                  {(action.dueAt || done) && (
                    <p
                      className={cn(
                        "mt-0.5 flex items-center gap-1 text-xs",
                        overdue
                          ? "font-semibold text-amber-800"
                          : "text-slate-500"
                      )}
                    >
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
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
          })}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5"
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("detail.nextAction")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            placeholder={t("followUp.placeholder")}
          />
          <DateTimePicker
            id={`lead-${leadId}-new-action-at`}
            label={t("detail.nextActionAt")}
            value={dueAt}
            onChange={setDueAt}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!title.trim() || add.isPending}
          isLoading={add.isPending}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("followUp.add")}
        </Button>
      </form>
    </section>
  );
}
