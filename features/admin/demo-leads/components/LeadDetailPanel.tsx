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
import { Lightbulb, MessageCircle, Trash2 } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { LeadActionsSection } from "@/features/admin/demo-leads/components/LeadActionsSection";
import { IndustrySelect } from "@/features/auth/components/IndustrySelect";
import { SegmentedControl } from "@/components/ui/pill-group";
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
  safeLabel,
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
  const [tab, setTab] = useState<"profile" | "activity" | "notes">("profile");
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
        lostReason:
          stage === "LOST" ? (form.get("lostReason") as string) || null : null,
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
    addNote.mutate({ id, body }, { onSuccess: () => setNoteBody("") });
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
  const sectionTitle = "mb-2.5 text-sm font-semibold text-slate-700";

  return (
    <>
      <Drawer open={!!leadId} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader className="border-b border-slate-100/80 px-6 pb-5 pt-6">
            <div className="flex items-start gap-3.5 pr-10">
              {detail && (
                <InitialsAvatar
                  name={detail.lead.name}
                  seed={detail.lead.id}
                  size="lg"
                />
              )}
              <div className="min-w-0 flex-1">
                <DrawerTitle className="truncate text-xl font-bold text-slate-900">
                  {detail ? detail.lead.name || t("card.noName") : "…"}
                </DrawerTitle>
                {detail &&
                  (detail.lead.establishmentName ||
                    detail.lead.businessType) && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {[detail.lead.establishmentName, detail.lead.businessType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                {detail && (
                  <p className="mt-0.5 text-sm tabular-nums text-slate-500">
                    {formatPhone(detail.lead.phone)}
                  </p>
                )}
                {detail?.lead.source === "MANUAL" && (
                  <p className="mt-1.5 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    {detail.lead.referredBy
                      ? t("detail.manualReferred", {
                          name: detail.lead.referredBy,
                        })
                      : t("detail.manual")}
                  </p>
                )}
              </div>
            </div>
            {detail && !detail.lead.revoked && (
              <a
                href={`https://wa.me/${detail.lead.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 items-center gap-2 self-start rounded-full bg-green-600 px-4.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
                {t("detail.writeWhatsApp")}
              </a>
            )}
          </DrawerHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
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

                <section className="flex gap-3.5 rounded-[20px] border border-indigo-100 bg-indigo-50 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Lightbulb className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-indigo-700">
                      {t("detail.suggestion")}
                    </p>
                    <p className="mt-0.5 text-[15px] text-indigo-950">
                      {safeLabel(
                        tt,
                        `suggestions.${detail.suggestion.key}`,
                        detail.suggestion.key
                      )}
                    </p>
                    <p className="mt-1 text-xs text-indigo-700">
                      {detail.suggestion.reason}
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>{t("detail.summary")}</h3>
                  <dl className="grid grid-cols-2 gap-2.5 text-sm">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryOrders")}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                        {detail.summary.orderCount}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryTries")}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                        {detail.summary.demoCount}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryActions")}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                        {detail.summary.distinctActionTypes}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryLastEvent")}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                        {formatDateTime(detail.summary.lastActivityAt, locale)}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryWhatsApp")}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                        {detail.summary.hasWhatsApp ? "✓" : "—"}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                      <dt className="text-xs text-slate-500">
                        {t("detail.summaryInbox")}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                        {detail.summary.repliedInInbox ? "✓" : "—"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <SegmentedControl
                  label={t("detail.tabsLabel")}
                  variant="tabs"
                  value={tab}
                  onChange={setTab}
                  options={[
                    { id: "profile", label: t("detail.profile") },
                    { id: "activity", label: t("detail.timeline") },
                    {
                      id: "notes",
                      label: detail.notes.length
                        ? `${t("detail.notes")} · ${detail.notes.length}`
                        : t("detail.notes"),
                    },
                  ]}
                />

                {tab === "profile" && (
                  <LeadActionsSection
                    leadId={detail.lead.id}
                    actions={detail.actions ?? []}
                  />
                )}

                {tab === "profile" && (
                  <section>
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
                        <IndustrySelect
                          id="lead-detail-business-type"
                          label={t("detail.businessType")}
                          name="businessType"
                          defaultValue={detail.lead.businessType ?? ""}
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
                )}

                {tab === "activity" && (
                  <section>
                    {detail.events.length === 0 ? (
                      <p className="text-xs text-slate-500">—</p>
                    ) : (
                      <ol className="flex flex-col">
                        {detail.events.map((event, index) => (
                          <li key={event.id} className="flex gap-3.5">
                            <span className="flex flex-col items-center">
                              <span
                                className="mt-1 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100"
                                aria-hidden
                              />
                              {index < detail.events.length - 1 && (
                                <span
                                  className="my-1 w-0.5 flex-1 bg-slate-200"
                                  aria-hidden
                                />
                              )}
                            </span>
                            <span className="flex flex-1 flex-col pb-4">
                              <span className="text-sm font-medium text-slate-900">
                                {event.type === "DEMO_STARTED" &&
                                event.metadata?.firstDemo === true
                                  ? t("events.DEMO_STARTED_FIRST")
                                  : safeLabel(
                                      tt,
                                      `events.${event.type}`,
                                      event.type
                                    )}
                              </span>
                              <span className="mt-0.5 text-[13px] text-slate-500">
                                {formatDateTime(event.occurredAt, locale)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                )}

                {tab === "notes" && (
                  <section>
                    <ul className="space-y-2 mb-3">
                      {detail.notes.map((note) => (
                        <li
                          key={note.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-sm"
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
                )}

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
                name: detail?.lead.name || t("card.noName"),
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
