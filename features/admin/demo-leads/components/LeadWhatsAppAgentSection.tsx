"use client";

/**
 * LeadWhatsAppAgentSection — Agente ToGo (Writer & Handler) para WhatsApp.
 *
 * No consume la API de IA al abrir la tarjeta: si el lead ya tiene borradores
 * persistidos en BD (`lead.whatsappDrafts`), los muestra de inmediato. Si aún
 * no se han generado, muestra el botón para generarlos 1 sola vez y
 * persistirlos, manteniendo la opción de volver a generar cuando el usuario
 * quiera otra alternativa.
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowRight,
  Info,
  MessageCircle,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/pill-group";
import { HoverTooltip } from "@/features/orders/components/HoverTooltip";
import type {
  DemoLeadDetail,
  DemoLeadStage,
  WhatsAppDraftItem,
  WhatsAppDraftsResponse,
} from "@/types/auth.types";
import {
  useGenerateWhatsAppDrafts,
  useLogWhatsAppOutreach,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";
import {
  DEMO_LEAD_STAGES,
  OPEN_DEMO_LEAD_STAGES,
} from "@/features/admin/demo-leads/utils/demo-leads.utils";

interface LeadWhatsAppAgentSectionProps {
  detail: DemoLeadDetail;
}

function defaultTargetStage(stage: DemoLeadStage): DemoLeadStage {
  if (stage === "TO_CONTACT") {
    return "CONTACTED";
  }
  return stage;
}

/**
 * Enviar un WhatsApp no cierra un lead (cerrar exige ganado / perdido): si la
 * recomendación es CLOSED y el lead sigue abierto, se usa la etapa por defecto.
 */
function safeTargetStage(
  recommended: DemoLeadStage | undefined,
  current: DemoLeadStage
): DemoLeadStage {
  if (!recommended || (recommended === "CLOSED" && current !== "CLOSED")) {
    return defaultTargetStage(current);
  }
  return recommended;
}

export function LeadWhatsAppAgentSection({
  detail,
}: LeadWhatsAppAgentSectionProps) {
  const t = useTranslations("admin-demo-leads");
  const { lead } = detail;

  const generateDrafts = useGenerateWhatsAppDrafts(lead.id);
  const logOutreach = useLogWhatsAppOutreach();

  const persisted =
    lead.whatsappDrafts &&
    lead.whatsappDrafts.generatedForStage === lead.stage &&
    Array.isArray(lead.whatsappDrafts.drafts) &&
    lead.whatsappDrafts.drafts.length > 0
      ? lead.whatsappDrafts
      : null;

  const [drafts, setDrafts] = useState<WhatsAppDraftItem[]>(
    () => persisted?.drafts ?? []
  );
  const [selectedDraftId, setSelectedDraftId] = useState<string>(
    () => persisted?.drafts[0]?.id ?? "direct"
  );
  const [messageText, setMessageText] = useState<string>(
    () => persisted?.drafts[0]?.message ?? ""
  );
  const [strategySummary, setStrategySummary] = useState<string>(
    () => persisted?.strategySummary ?? ""
  );
  const [nextStage, setNextStage] = useState<DemoLeadStage>(
    () => safeTargetStage(persisted?.recommendedNextStage, lead.stage)
  );
  const [nextActionTitle, setNextActionTitle] = useState<string>(
    () => persisted?.recommendedNextAction ?? ""
  );
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [prospectReply, setProspectReply] = useState<string>("");
  const [objective, setObjective] = useState<string>("");

  const applyDraftsResponse = React.useCallback(
    (res: WhatsAppDraftsResponse) => {
      setDrafts(res.drafts);
      setStrategySummary(res.strategySummary);
      setNextStage(safeTargetStage(res.recommendedNextStage, lead.stage));
      setNextActionTitle(res.recommendedNextAction);
      const first = res.drafts[0];
      if (first) {
        setSelectedDraftId(first.id);
        setMessageText(first.message);
      }
    },
    [lead.stage]
  );

  if (lead.revoked) {
    return null;
  }

  const handleSelectDraft = (draft: WhatsAppDraftItem) => {
    setSelectedDraftId(draft.id);
    setMessageText(draft.message);
  };

  const handleGenerateOrRegenerate = (forceRegenerate: boolean = false) => {
    generateDrafts.mutate(
      {
        prospectReply: prospectReply.trim() || undefined,
        objective: objective.trim() || undefined,
        forceRegenerate: forceRegenerate || undefined,
      },
      {
        onSuccess: applyDraftsResponse,
      }
    );
  };

  const handleSendWhatsApp = () => {
    const cleanMessage = messageText.trim();
    if (!cleanMessage) return;

    const digits = lead.phone.replace(/\D/g, "");
    const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
      cleanMessage
    )}`;
    const popup = window.open(waUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      toast.error(t("agent.popupBlocked"));
      return;
    }

    logOutreach.mutate({
      id: lead.id,
      data: {
        message: cleanMessage,
        nextStage,
        prospectReply: prospectReply.trim() || undefined,
        nextActionTitle: nextActionTitle.trim() || undefined,
      },
    });
  };

  const activeDraft = drafts.find((d) => d.id === selectedDraftId);
  const hasPersistedOrGeneratedDrafts = drafts.length > 0;

  return (
    <section className="space-y-3">
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
            {t("agent.title")}
          </h3>
          <button
            type="button"
            aria-pressed={showCustomize}
            aria-label={t("agent.customize")}
            title={t("agent.customize")}
            onClick={() => setShowCustomize((v) => !v)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              showCustomize
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </button>
          {hasPersistedOrGeneratedDrafts && (
            <button
              type="button"
              aria-label={t("agent.regenerate")}
              title={t("agent.regenerate")}
              onClick={() => handleGenerateOrRegenerate(true)}
              disabled={generateDrafts.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  generateDrafts.isPending && "animate-spin"
                )}
                aria-hidden
              />
            </button>
          )}
        </div>

        {showCustomize && (
          <div className="space-y-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">
                {t("agent.prospectReplyLabel")}
              </span>
              <Textarea
                rows={2}
                value={prospectReply}
                onChange={(e) => setProspectReply(e.target.value)}
                placeholder={t("agent.prospectReplyPlaceholder")}
                maxLength={1000}
                className="text-sm"
              />
            </label>
            <Input
              label={t("agent.objectiveLabel")}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder={t("agent.objectivePlaceholder")}
              maxLength={300}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleGenerateOrRegenerate(true)}
              disabled={generateDrafts.isPending}
              className="w-full rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {generateDrafts.isPending
                ? t("agent.generating")
                : t("agent.generateWithContext")}
            </Button>
          </div>
        )}

        {!hasPersistedOrGeneratedDrafts && (
          <div className="rounded-xl border border-dashed border-emerald-300/90 p-4 text-center">
            <p className="text-[13px] text-slate-600">{t("agent.emptyHint")}</p>
            <Button
              type="button"
              size="sm"
              onClick={() => handleGenerateOrRegenerate(false)}
              disabled={generateDrafts.isPending}
              isLoading={generateDrafts.isPending}
              className="mt-3 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {generateDrafts.isPending
                ? t("agent.generating")
                : t("agent.generateInitialButton")}
            </Button>
          </div>
        )}

        {hasPersistedOrGeneratedDrafts && (
          <SegmentedControl
            label={t("agent.variantsLabel")}
            variant="tabs"
            value={selectedDraftId}
            onChange={(id) => {
              const draft = drafts.find((d) => d.id === id);
              if (draft) handleSelectDraft(draft);
            }}
            options={drafts.map((draft) => ({
              id: draft.id,
              label: draft.label,
            }))}
          />
        )}

        <Textarea
          rows={7}
          aria-label={t("agent.messageLabel")}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={
            generateDrafts.isPending
              ? t("agent.generating")
              : t("agent.messagePlaceholder")
          }
          maxLength={2000}
          className="text-[14.5px] leading-relaxed text-slate-900"
        />
        {activeDraft?.rationale && (
          <p className="flex gap-1.5 text-xs leading-relaxed text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {activeDraft.rationale}
          </p>
        )}
        {strategySummary && (
          <details className="border-t border-slate-100 pt-2.5">
            <summary className="cursor-pointer text-[13px] font-semibold text-slate-600">
              {t("agent.strategy")}
            </summary>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              {strategySummary}
            </p>
          </details>
        )}
      </div>

      {/* Envío: la etapa avanza sola al enviar */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
          <span>{t("agent.sendMoves")}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
            {t(`stages.${lead.stage}`)}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <Select
            value={nextStage}
            onValueChange={(v) => setNextStage(v as DemoLeadStage)}
          >
            <SelectTrigger
              aria-label={t("agent.autoStageLabel")}
              className="h-8 w-auto min-w-[150px] text-[13px] font-semibold"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(lead.stage === "CLOSED"
                ? DEMO_LEAD_STAGES
                : OPEN_DEMO_LEAD_STAGES
              ).map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {t(`stages.${stage}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <HoverTooltip content={t("agent.sendDisclaimer")}>
            <button
              type="button"
              aria-label={t("agent.sendDisclaimer")}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Info className="h-4 w-4" aria-hidden />
            </button>
          </HoverTooltip>
        </div>
        <Button
          type="button"
          onClick={handleSendWhatsApp}
          disabled={
            !messageText.trim() ||
            generateDrafts.isPending ||
            logOutreach.isPending
          }
          isLoading={logOutreach.isPending}
          className="h-11 w-full rounded-xl bg-green-700 text-sm font-semibold text-white hover:bg-green-800"
        >
          <MessageCircle className="mr-2 h-[18px] w-[18px]" aria-hidden />
          {t("agent.send")}
        </Button>
      </div>
    </section>
  );
}
