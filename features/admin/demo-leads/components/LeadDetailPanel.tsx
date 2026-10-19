/**
 * LeadDetailPanel
 * Drawer lateral con la ficha comercial del lead: resumen de actividad,
 * acción sugerida, formulario de perfil, línea de tiempo y notas.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import type {
  DemoLeadDetailLead,
  DemoLeadPriority,
  DemoLeadStage,
  UpdateDemoLeadRequest,
} from "@/types/auth.types";
import {
  useAddDemoLeadNote,
  useDeleteDemoLead,
  useDemoLeadDetail,
  useUpdateDemoLead,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";
import {
  DEMO_LEAD_PRIORITIES,
  DEMO_LEAD_STAGES,
  formatDateTime,
  formatPhone,
  parseOptionalIsoDateTime,
  safeLabel,
  toInputDateTime,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

interface LeadDetailPanelProps {
  leadId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function LeadDetailPanel({
  leadId,
  onClose,
  onDeleted,
}: LeadDetailPanelProps) {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useDemoLeadDetail(leadId);
  const updateLead = useUpdateDemoLead();
  const addNote = useAddDemoLeadNote();
  const deleteLead = useDeleteDemoLead();

  const [noteBody, setNoteBody] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleSave =
    (lead: DemoLeadDetailLead) => (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const stage = form.get("stage") as DemoLeadStage;
      const priority = form.get("priority") as DemoLeadPriority;
      const data: UpdateDemoLeadRequest = {
        stage,
        priority,
        businessType: (form.get("businessType") as string) || null,
        businessName: (form.get("businessName") as string) || null,
        estimatedOrders: form.get("estimatedOrders")
          ? Number(form.get("estimatedOrders"))
          : null,
        planInterest: (form.get("planInterest") as string) || null,
        mainNeed: (form.get("mainNeed") as string) || null,
        nextAction: (form.get("nextAction") as string) || null,
        nextActionAt: parseOptionalIsoDateTime(form.get("nextActionAt")),
        lostReason:
          stage === "LOST"
            ? ((form.get("lostReason") as string) || null)
            : null,
        // Marcada: revoca con sello de ahora. Sin marcar: no toca el sello.
        revokedAt:
          form.get("revokeConsent") === "on"
            ? new Date().toISOString()
            : undefined,
      };
      updateLead.mutate({ id: lead.id, data });
    };

  const handleAddNote = (id: string) => (e: React.FormEvent) => {
    e.preventDefault();
    const body = noteBody.trim();
    if (!body) return;
    addNote.mutate(
      { id, body },
      { onSuccess: () => setNoteBody("") },
    );
  };

  const confirmDelete = () => {
    if (!detail) return;
    deleteLead.mutate(detail.lead.id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false);
        onClose();
        onDeleted?.();
      },
    });
  };

  const tt = t as (key: string) => string;

  return (
    <>
      <Drawer open={!!leadId} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>
              {detail
                ? `${detail.lead.name} · ${formatPhone(detail.lead.phone)}`
                : "…"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 space-y-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">…</p>
            ) : isError || !detail ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-red-600">{t("detail.loadError")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                {detail.lead.revoked && (
                  <Badge variant="destructive">{t("card.revoked")}</Badge>
                )}

                <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    {t("detail.suggestion")}
                  </p>
                  <p className="text-sm text-amber-900">
                    {safeLabel(
                      tt,
                      `suggestions.${detail.suggestion.key}`,
                      detail.suggestion.key,
                    )}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {detail.suggestion.reason}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    {t("detail.summary")}
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryOrders")}
                      </dt>
                      <dd className="font-medium">
                        {detail.summary.orderCount}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryTries")}
                      </dt>
                      <dd className="font-medium">
                        {detail.summary.demoCount}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryActions")}
                      </dt>
                      <dd className="font-medium">
                        {detail.summary.distinctActionTypes}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryLastEvent")}
                      </dt>
                      <dd className="font-medium">
                        {formatDateTime(detail.summary.lastActivityAt, locale)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryWhatsApp")}
                      </dt>
                      <dd className="font-medium">
                        {detail.summary.hasWhatsApp ? "✓" : "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryInbox")}
                      </dt>
                      <dd className="font-medium">
                        {detail.summary.repliedInInbox ? "✓" : "—"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    {t("detail.profile")}
                  </h3>
                  <form
                    key={`${detail.lead.id}-${detail.lead.stage}-${detail.lead.priority}-${detail.lead.revoked}`}
                    onSubmit={handleSave(detail.lead)}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-slate-600 space-y-1">
                        <span>{t("detail.stage")}</span>
                        <Select name="stage" defaultValue={detail.lead.stage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEMO_LEAD_STAGES.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {t(`stages.${stage}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="text-xs text-slate-600 space-y-1">
                        <span>{t("detail.priority")}</span>
                        <Select
                          name="priority"
                          defaultValue={detail.lead.priority}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEMO_LEAD_PRIORITIES.map((p) => (
                              <SelectItem key={p} value={p}>
                                {t(`filters.priority.${p}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t("detail.businessType")}
                        name="businessType"
                        defaultValue={detail.lead.businessType ?? ""}
                        maxLength={60}
                      />
                      <Input
                        label={t("detail.businessName")}
                        name="businessName"
                        defaultValue={detail.lead.establishmentName ?? ""}
                        maxLength={120}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t("detail.estimatedOrders")}
                        name="estimatedOrders"
                        type="number"
                        min={0}
                        defaultValue={detail.lead.estimatedOrders ?? ""}
                      />
                      <Input
                        label={t("detail.planInterest")}
                        name="planInterest"
                        defaultValue={detail.lead.planInterest ?? ""}
                        maxLength={60}
                      />
                    </div>
                    <Input
                      label={t("detail.mainNeed")}
                      name="mainNeed"
                      defaultValue={detail.lead.mainNeed ?? ""}
                      maxLength={255}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t("detail.nextAction")}
                        name="nextAction"
                        defaultValue={detail.lead.nextAction ?? ""}
                        maxLength={255}
                      />
                      <Input
                        label={t("detail.nextActionAt")}
                        name="nextActionAt"
                        type="datetime-local"
                        defaultValue={toInputDateTime(detail.lead.nextActionAt)}
                      />
                    </div>
                    <Input
                      label={t("detail.lostReason")}
                      name="lostReason"
                      defaultValue={detail.lead.lostReason ?? ""}
                      maxLength={255}
                    />
                    {!detail.lead.revoked && (
                      <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          name="revokeConsent"
                          className="mt-0.5 h-4 w-4 accent-slate-900"
                        />
                        <span>
                          {t("detail.revokeConsent")} {t("detail.revokeHint")}
                        </span>
                      </label>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={updateLead.isPending}
                      disabled={updateLead.isPending}
                    >
                      {updateLead.isPending
                        ? t("detail.saving")
                        : t("detail.save")}
                    </Button>
                  </form>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    {t("detail.timeline")}
                  </h3>
                  {detail.events.length === 0 ? (
                    <p className="text-xs text-slate-500">—</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.events.map((event) => (
                        <li
                          key={event.id}
                          className="flex items-start justify-between gap-2 text-sm"
                        >
                          <span className="text-slate-700">
                            {safeLabel(
                              tt,
                              `events.${event.type}`,
                              event.type,
                            )}
                          </span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDateTime(event.occurredAt, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    {t("detail.notes")}
                  </h3>
                  <ul className="space-y-2 mb-3">
                    {detail.notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-lg border border-slate-200 p-2 text-sm"
                      >
                        <p className="text-slate-800">{note.body}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {note.authorName ?? "—"} ·{" "}
                          {formatDateTime(note.createdAt, locale)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <form
                    onSubmit={handleAddNote(detail.lead.id)}
                    className="flex gap-2"
                  >
                    <Textarea
                      placeholder={t("detail.notePlaceholder")}
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={addNote.isPending || !noteBody.trim()}
                      isLoading={addNote.isPending}
                    >
                      {t("detail.addNote")}
                    </Button>
                  </form>
                </section>

                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deleteLead.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("detail.delete")}
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => !open && setConfirmDeleteOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("detail.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.deleteConfirmDescription", {
                name: detail?.lead.name ?? "",
                phone: formatPhone(detail?.lead.phone),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("detail.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLead.isPending ? t("detail.deleting") : t("detail.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
