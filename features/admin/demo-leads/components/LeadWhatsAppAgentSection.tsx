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
    <section className="rounded-[22px] border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-4 shadow-card-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t("agent.title")}
            </h3>
            <p className="text-xs text-slate-600">
              {strategySummary || t("agent.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomize((v) => !v)}
            className="h-8 rounded-full px-2.5 text-xs text-slate-600 hover:bg-emerald-100/60"
          >
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" aria-hidden />
            {t("agent.customize")}
          </Button>
          {hasPersistedOrGeneratedDrafts && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleGenerateOrRegenerate(true)}
              disabled={generateDrafts.isPending}
              className="h-8 rounded-full px-2.5 text-xs text-emerald-700 hover:bg-emerald-100/60"
              title={t("agent.regenerate")}
            >
              <RefreshCw
                className={cn(
                  "mr-1 h-3.5 w-3.5",
                  generateDrafts.isPending && "animate-spin"
                )}
                aria-hidden
              />
              <span className="hidden sm:inline">{t("agent.regenerate")}</span>
            </Button>
          )}
        </div>
      </div>

      {showCustomize && (
        <div className="mt-3 space-y-2.5 rounded-2xl border border-emerald-200/70 bg-white/85 p-3">
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
              className="text-xs"
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
        <div className="mt-3 rounded-2xl border border-dashed border-emerald-300/90 bg-white/75 p-3.5 text-center">
          <p className="text-xs text-slate-600">{t("agent.emptyHint")}</p>
          <Button
            type="button"
            size="sm"
            onClick={() => handleGenerateOrRegenerate(false)}
            disabled={generateDrafts.isPending}
            isLoading={generateDrafts.isPending}
            className="mt-2.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {generateDrafts.isPending
              ? t("agent.generating")
              : t("agent.generateInitialButton")}
          </Button>
        </div>
      )}

      {hasPersistedOrGeneratedDrafts && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {drafts.map((draft) => {
            const selected = draft.id === selectedDraftId;
            return (
              <button
                key={draft.id}
                type="button"
                onClick={() => handleSelectDraft(draft)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  selected
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-emerald-200 bg-white/80 text-slate-700 hover:bg-white"
                )}
              >
                {draft.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2.5 space-y-2">
        <Textarea
          rows={4}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={
            generateDrafts.isPending
              ? t("agent.generating")
              : t("agent.messagePlaceholder")
          }
          maxLength={2000}
          className="bg-white/95 text-sm leading-relaxed text-slate-900"
        />
        {activeDraft?.rationale && (
          <p className="text-[11px] text-slate-500">
            💡 {activeDraft.rationale}
          </p>
        )}
      </div>

      {/* Transición de estado automática al enviar */}
      <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-white/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span>{t("agent.autoStageLabel")}:</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              {t(`stages.${lead.stage}`)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          </div>
          <div className="w-44">
            <Select
              value={nextStage}
              onValueChange={(v) => setNextStage(v as DemoLeadStage)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold">
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
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {t("agent.sendDisclaimer")}
        </p>
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
        className="mt-3 h-11 w-full rounded-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
      >
        <MessageCircle className="mr-2 h-[18px] w-[18px]" aria-hidden />
        {t("agent.sendAndAdvance", {
          stage: t(`stages.${nextStage}`),
        })}
      </Button>
    </section>
  );
}
