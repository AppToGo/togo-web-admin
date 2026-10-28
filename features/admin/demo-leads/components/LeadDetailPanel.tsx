/**
 * LeadDetailPanel
 * Drawer lateral con la ficha del posible cliente. Encabezado fijo (quién es,
 * etapa, prioridad, responsable, teléfono y actividad en una fila) y cuatro
 * pestañas: Contactar (agente de WhatsApp), Seguimiento (acciones), Ficha
 * (perfil comercial) e Historial (línea de tiempo y notas).
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Ban,
  Compass,
  Copy,
  Flag,
  Lightbulb,
  Phone,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { LeadActionsSection } from "@/features/admin/demo-leads/components/LeadActionsSection";
import { LeadWhatsAppAgentSection } from "@/features/admin/demo-leads/components/LeadWhatsAppAgentSection";
import { LeadOwnerAvatar } from "@/features/admin/demo-leads/components/LeadOwnerAvatar";
import { IndustrySelect } from "@/features/auth/components/IndustrySelect";
import { SegmentedControl } from "@/components/ui/pill-group";
import type {
  DemoLeadDetail,
  DemoLeadDetailLead,
  DemoLeadOutcome,
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
  DEMO_LEAD_OUTCOMES,
  DEMO_LEAD_PRIORITIES,
  OPEN_DEMO_LEAD_STAGES,
  STAGE_DOT_CLASS,
  formatDateTime,
  formatPhone,
  formatRelative,
  safeLabel,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

type DetailTab = "contact" | "followUp" | "profile" | "history";

/** Valor del selector de etapa: las abiertas tal cual, cerrado con su resultado. */
type StageOption = DemoLeadStage | `CLOSED:${DemoLeadOutcome}`;

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
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useDemoLeadDetail(leadId);
  const deleteLead = useDeleteDemoLead();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  return (
    <>
      <Drawer open={!!leadId} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          {isLoading || (!detail && !isError) ? (
            <>
              <DrawerTitle className="sr-only">…</DrawerTitle>
              <p className="px-6 py-6 text-sm text-slate-500">…</p>
            </>
          ) : isError || !detail ? (
            <div className="flex items-center gap-3 px-6 py-6">
              <DrawerTitle className="sr-only">{t("detail.loadError")}</DrawerTitle>
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
            // key: al cambiar de lead la pestaña vuelve a la inicial.
            <LeadDetailBody
              key={detail.lead.id}
              detail={detail}
              onDelete={() => setConfirmDeleteOpen(true)}
              isDeleting={deleteLead.isPending}
            />
          )}
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

function LeadDetailBody({
  detail,
  onDelete,
  isDeleting,
}: {
  detail: DemoLeadDetail;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const tt = t as (key: string) => string;
  const updateLead = useUpdateDemoLead();
  const { lead, summary, suggestion } = detail;
  // Sin consentimiento no hay agente: arranca en Seguimiento.
  const [tab, setTab] = useState<DetailTab>(
    lead.revoked ? "followUp" : "contact"
  );

  const pendingActions = (detail.actions ?? []).filter((a) => !a.doneAt).length;
  const business = [lead.establishmentName, lead.businessType]
    .filter(Boolean)
    .join(" · ");
  const stageValue: StageOption =
    lead.stage === "CLOSED" && lead.outcome
      ? `CLOSED:${lead.outcome}`
      : lead.stage;

  const changeStage = (value: string) => {
    if (value === stageValue) return;
    const [stage, outcome] = value.split(":") as [
      DemoLeadStage,
      DemoLeadOutcome | undefined,
    ];
    updateLead.mutate({
      id: lead.id,
      data: { stage, outcome: outcome ?? null },
    });
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(formatPhone(lead.phone));
      toast.success(t("detail.phoneCopied"));
    } catch {
      toast.error(t("detail.phoneCopyError"));
    }
  };

  const chip =
    "h-8 w-auto gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-slate-700";

  return (
    <>
      <DrawerHeader className="space-y-3.5 px-6 pb-0 pt-5">
        <div className="flex items-start gap-3 pr-10">
          <InitialsAvatar name={lead.name} seed={lead.id} size="sm" />
          <div className="min-w-0 flex-1">
            <DrawerTitle className="line-clamp-2 pr-0 text-lg font-bold leading-snug text-slate-900">
              {lead.name || t("card.noName")}
            </DrawerTitle>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-slate-500">
              {business && <span className="truncate">{business}</span>}
              {business && lead.source !== "DEMO" && <span aria-hidden>·</span>}
              {lead.source === "SCOUT" && (
                <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                  <Compass className="h-3.5 w-3.5" aria-hidden />
                  {t("card.scout")}
                </span>
              )}
              {lead.source === "MANUAL" && (
                <span className="font-semibold text-violet-700">
                  {lead.referredBy
                    ? t("detail.manualReferred", { name: lead.referredBy })
                    : t("detail.manual")}
                </span>
              )}
            </p>
            <p className="mt-1 flex items-center gap-0.5 text-[13px] tabular-nums text-slate-700">
              <span className="mr-1">{formatPhone(lead.phone)}</span>
              <button
                type="button"
                onClick={copyPhone}
                aria-label={t("detail.copyPhone")}
                title={t("detail.copyPhone")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
              </button>
              <a
                href={`tel:${formatPhone(lead.phone)}`}
                aria-label={t("detail.call")}
                title={t("detail.call")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
              </a>
            </p>
          </div>
        </div>

        {/* Etapa, prioridad y responsable: se guardan al cambiar */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={stageValue} onValueChange={changeStage}>
            <SelectTrigger aria-label={t("detail.stage")} className={chip}>
              <span
                aria-hidden
                className={cn("h-2 w-2 rounded-full", STAGE_DOT_CLASS[lead.stage])}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPEN_DEMO_LEAD_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {t(`stages.${stage}`)}
                </SelectItem>
              ))}
              {DEMO_LEAD_OUTCOMES.map((outcome) => (
                <SelectItem key={outcome} value={`CLOSED:${outcome}`}>
                  {`${t("stages.CLOSED")} · ${t(`outcomes.${outcome}`)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={lead.priority}
            onValueChange={(priority) =>
              priority !== lead.priority &&
              updateLead.mutate({
                id: lead.id,
                data: { priority: priority as DemoLeadPriority },
              })
            }
          >
            <SelectTrigger
              aria-label={t("detail.priority")}
              className={cn(
                chip,
                lead.priority === "HIGH" && "border-red-200 bg-red-50 text-red-700"
              )}
            >
              <Flag className="h-3.5 w-3.5" aria-hidden />
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
          <LeadOwnerAvatar
            lead={lead}
            showName
            className="h-8 rounded-lg border border-slate-200 bg-white pl-1 pr-2.5 text-[13px] font-semibold"
          />
        </div>

        {/* Actividad en una fila */}
        <dl className="grid grid-cols-4 overflow-hidden rounded-xl border border-slate-200/70 bg-white/70">
          {[
            { label: t("detail.statOrders"), value: summary.orderCount },
            { label: t("detail.statTries"), value: summary.demoCount },
            {
              label: t("detail.statLast"),
              value: formatRelative(summary.lastActivityAt, locale),
            },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0 border-r border-slate-200/70 px-2.5 py-2">
              <dt className="truncate text-[11.5px] text-slate-500">{label}</dt>
              <dd className="truncate text-[15px] font-bold tabular-nums text-slate-900">
                {value}
              </dd>
            </div>
          ))}
          <div className="min-w-0 px-2.5 py-2">
            <dt className="truncate text-[11.5px] text-slate-500">
              {t("detail.statChannels")}
            </dt>
            <dd className="mt-0.5 flex gap-1">
              {[
                { key: "WA", on: summary.hasWhatsApp, title: t("detail.summaryWhatsApp") },
                { key: "Inbox", on: summary.repliedInInbox, title: t("detail.summaryInbox") },
              ].map(({ key, on, title }) => (
                <span
                  key={key}
                  title={`${title}: ${on ? "✓" : "—"}`}
                  className={cn(
                    "rounded-md px-1.5 text-[11px] font-semibold leading-5",
                    on ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {key}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <SegmentedControl
          label={t("detail.tabsLabel")}
          variant="tabs"
          value={tab}
          onChange={setTab}
          className="-mx-1"
          options={[
            { id: "contact", label: t("detail.tabContact") },
            {
              id: "followUp",
              label: pendingActions
                ? `${t("detail.tabFollowUp")} · ${pendingActions}`
                : t("detail.tabFollowUp"),
            },
            { id: "profile", label: t("detail.tabProfile") },
            {
              id: "history",
              label: detail.notes.length
                ? `${t("detail.tabHistory")} · ${detail.notes.length}`
                : t("detail.tabHistory"),
            },
          ]}
        />
      </DrawerHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {lead.revoked && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            <Ban className="h-4 w-4 shrink-0" aria-hidden />
            {t("card.noContact")}
          </p>
        )}

        {tab === "contact" && (
          <>
            <div className="flex gap-2.5 rounded-xl bg-indigo-50 px-3.5 py-3">
              <Lightbulb className="mt-0.5 h-[18px] w-[18px] shrink-0 text-indigo-600" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-indigo-950">
                  {safeLabel(tt, `suggestions.${suggestion.key}`, suggestion.key)}
                </p>
                <p className="mt-0.5 text-[12.5px] text-indigo-700">
                  {suggestion.reason}
                </p>
              </div>
            </div>
            {lead.revoked ? null : (
              <LeadWhatsAppAgentSection
                key={`${lead.id}:${lead.stage}:${lead.whatsappDraftsAt ?? ""}`}
                detail={detail}
              />
            )}
          </>
        )}

        {tab === "followUp" && (
          <LeadActionsSection
            leadId={lead.id}
            leadName={lead.name}
            actions={detail.actions ?? []}
          />
        )}

        {tab === "profile" && (
          <LeadProfileForm
            lead={lead}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        )}

        {tab === "history" && <LeadHistory detail={detail} />}
      </div>
    </>
  );
}

/** Pestaña Ficha: perfil comercial agrupado; etapa y prioridad van arriba. */
function LeadProfileForm({
  lead,
  onDelete,
  isDeleting,
}: {
  lead: DemoLeadDetailLead;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const t = useTranslations("admin-demo-leads");
  const updateLead = useUpdateDemoLead();
  const lost = lead.stage === "CLOSED" && lead.outcome === "LOST";

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: UpdateDemoLeadRequest = {
      businessType: (form.get("businessType") as string) || null,
      businessName: (form.get("businessName") as string) || null,
      estimatedOrders: form.get("estimatedOrders")
        ? Number(form.get("estimatedOrders"))
        : null,
      planInterest: (form.get("planInterest") as string) || null,
      mainNeed: (form.get("mainNeed") as string) || null,
      // El motivo solo existe si se perdió; si no, no se toca.
      ...(lost && {
        lostReason: (form.get("lostReason") as string) || null,
      }),
      // Marcada: revoca con sello de ahora. Sin marcar: no toca el sello.
      revokedAt:
        form.get("revokeConsent") === "on" ? new Date().toISOString() : undefined,
    };
    updateLead.mutate({ id: lead.id, data });
  };

  const legend =
    "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <form
      key={`${lead.id}-${lead.stage}-${lead.outcome ?? ""}-${lead.revoked}`}
      onSubmit={handleSave}
      className="space-y-6"
    >
      <fieldset className="space-y-3">
        <legend className={legend}>{t("detail.groupBusiness")}</legend>
        <Input
          label={t("detail.businessName")}
          name="businessName"
          defaultValue={lead.establishmentName ?? ""}
          maxLength={120}
        />
        <div className="grid grid-cols-2 gap-3">
          <IndustrySelect
            id="lead-detail-business-type"
            label={t("detail.businessType")}
            name="businessType"
            defaultValue={lead.businessType ?? ""}
          />
          <Input
            label={t("detail.estimatedOrders")}
            name="estimatedOrders"
            type="number"
            min={0}
            defaultValue={lead.estimatedOrders ?? ""}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={legend}>{t("detail.groupOpportunity")}</legend>
        <Input
          label={t("detail.planInterest")}
          name="planInterest"
          defaultValue={lead.planInterest ?? ""}
          maxLength={60}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            {t("detail.mainNeed")}
          </span>
          <Textarea
            name="mainNeed"
            rows={3}
            defaultValue={lead.mainNeed ?? ""}
            maxLength={255}
            placeholder={t("detail.mainNeedPlaceholder")}
          />
        </label>
        {lost && (
          <Input
            label={t("detail.lostReason")}
            name="lostReason"
            defaultValue={lead.lostReason ?? ""}
            maxLength={255}
          />
        )}
      </fieldset>

      {!lead.revoked && (
        <fieldset>
          <legend className={legend}>{t("detail.groupPrivacy")}</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3">
            <input
              type="checkbox"
              name="revokeConsent"
              className="mt-0.5 h-[18px] w-[18px] accent-indigo-600"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium text-slate-900">
                {t("detail.revokeConsent")}
              </span>
              <span className="block text-xs text-slate-500">
                {t("detail.revokeHint")}
              </span>
            </span>
          </label>
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="ghost"
          className="-ml-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          {t("detail.deleteLead")}
        </Button>
        <Button
          type="submit"
          isLoading={updateLead.isPending}
          disabled={updateLead.isPending}
        >
          {updateLead.isPending ? t("detail.saving") : t("detail.save")}
        </Button>
      </div>
    </form>
  );
}

/** Pestaña Historial: notas (con su campo) y la línea de tiempo de la demo. */
function LeadHistory({ detail }: { detail: DemoLeadDetail }) {
  const t = useTranslations("admin-demo-leads");
  const locale = useLocale();
  const tt = t as (key: string) => string;
  const addNote = useAddDemoLeadNote();
  const [noteBody, setNoteBody] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const body = noteBody.trim();
    if (!body) return;
    addNote.mutate(
      { id: detail.lead.id, body },
      { onSuccess: () => setNoteBody("") }
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("detail.notes")}
        </h3>
        <form onSubmit={handleAddNote} className="space-y-2">
          <Textarea
            aria-label={t("detail.notePlaceholder")}
            placeholder={t("detail.notePlaceholder")}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={2}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={addNote.isPending || !noteBody.trim()}
              isLoading={addNote.isPending}
            >
              {t("detail.addNote")}
            </Button>
          </div>
        </form>
        <ul className="space-y-2">
          {detail.notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-slate-200/70 bg-white px-3.5 py-3 text-sm"
            >
              <p className="whitespace-pre-line text-slate-800">{note.body}</p>
              <p className="mt-1 text-xs text-slate-500">
                {note.authorName ?? "—"} · {formatDateTime(note.createdAt, locale)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("detail.timeline")}
        </h3>
        {detail.events.length === 0 ? (
          <p className="text-xs text-slate-500">—</p>
        ) : (
          <ol className="flex flex-col">
            {detail.events.map((event, index) => (
              <li key={event.id} className="flex gap-3.5">
                <span className="flex flex-col items-center">
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100"
                    aria-hidden
                  />
                  {index < detail.events.length - 1 && (
                    <span className="my-1 w-0.5 flex-1 bg-slate-200" aria-hidden />
                  )}
                </span>
                <span className="flex flex-1 flex-col pb-4">
                  <span className="text-sm font-medium text-slate-900">
                    {event.type === "DEMO_STARTED" &&
                    event.metadata?.firstDemo === true
                      ? t("events.DEMO_STARTED_FIRST")
                      : safeLabel(tt, `events.${event.type}`, event.type)}
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
    </div>
  );
}
