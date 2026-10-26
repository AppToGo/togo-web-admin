"use client";

/**
 * LeadWhatsAppAgentSection — Agente Harvey (Writer & Handler) para WhatsApp.
 *
 * Siempre activo para cualquier posible cliente que no haya revocado el
 * contacto. Genera mensajes personalizados según su etapa comercial,
 * actividad en la demo y notas; al pulsar Enviar abre wa.me con el mensaje
 * precargado, registra automáticamente la nota/evento y avanza la etapa.
 */

import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
} from "@/types/auth.types";
import {
  useGenerateWhatsAppDrafts,
  useLogWhatsAppOutreach,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";
import { DEMO_LEAD_STAGES } from "@/features/admin/demo-leads/utils/demo-leads.utils";

interface LeadWhatsAppAgentSectionProps {
  detail: DemoLeadDetail;
}

function defaultTargetStage(stage: DemoLeadStage): DemoLeadStage {
  if (stage === "NEW" || stage === "ACTIVE_DEMO" || stage === "FOLLOW_UP") {
    return "CONTACTED";
  }
  return stage;
}

export function LeadWhatsAppAgentSection({
  detail,
}: LeadWhatsAppAgentSectionProps) {
  const t = useTranslations("admin-demo-leads");
  const { lead } = detail;

  const generateDrafts = useGenerateWhatsAppDrafts(lead.id);
  const logOutreach = useLogWhatsAppOutreach();

  const [drafts, setDrafts] = useState<WhatsAppDraftItem[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>("direct");
  const [messageText, setMessageText] = useState<string>("");
  const [strategySummary, setStrategySummary] = useState<string>("");
  const [nextStage, setNextStage] = useState<DemoLeadStage>(() =>
    defaultTargetStage(lead.stage)
  );
  const [nextActionTitle, setNextActionTitle] = useState<string>("");
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [prospectReply, setProspectReply] = useState<string>("");
  const [objective, setObjective] = useState<string>("");

  const applyDraftsResponse = React.useCallback(
    (res: {
      strategySummary: string;
      recommendedNextStage: DemoLeadStage;
      recommendedNextAction: string;
      drafts: WhatsAppDraftItem[];
    }) => {
      setDrafts(res.drafts);
      setStrategySummary(res.strategySummary);
      setNextStage(res.recommendedNextStage);
      setNextActionTitle(res.recommendedNextAction);
      const first = res.drafts[0];
      if (first) {
        setSelectedDraftId(first.id);
        setMessageText(first.message);
      }
    },
    []
  );

  useEffect(() => {
    if (lead.revoked) return;
    setNextStage(defaultTargetStage(lead.stage));
    generateDrafts.mutate(
      {},
      {
        onSuccess: applyDraftsResponse,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, lead.stage, lead.revoked]);

  if (lead.revoked) {
    return null;
  }

  const handleSelectDraft = (draft: WhatsAppDraftItem) => {
    setSelectedDraftId(draft.id);
    setMessageText(draft.message);
  };

  const handleRegenerate = () => {
    generateDrafts.mutate(
      {
        prospectReply: prospectReply.trim() || undefined,
        objective: objective.trim() || undefined,
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
    window.open(waUrl, "_blank", "noopener,noreferrer");

    logOutreach.mutate({
      id: lead.id,
      data: {
        message: cleanMessage,
        nextStage,
        nextActionTitle: nextActionTitle.trim() || undefined,
      },
    });
  };

  const activeDraft = drafts.find((d) => d.id === selectedDraftId);

  return (
    <section className="rounded-[22px] border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-4 shadow-card-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t("harvey.title")}
            </h3>
            <p className="text-xs text-slate-600">
              {strategySummary || t("harvey.subtitle")}
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
            {t("harvey.customize")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={generateDrafts.isPending}
            className="h-8 rounded-full px-2.5 text-xs text-emerald-700 hover:bg-emerald-100/60"
            title={t("harvey.regenerate")}
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                generateDrafts.isPending && "animate-spin"
              )}
              aria-hidden
            />
          </Button>
        </div>
      </div>

      {showCustomize && (
        <div className="mt-3 space-y-2.5 rounded-2xl border border-emerald-200/70 bg-white/85 p-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">
              {t("harvey.prospectReplyLabel")}
            </span>
            <Textarea
              rows={2}
              value={prospectReply}
              onChange={(e) => setProspectReply(e.target.value)}
              placeholder={t("harvey.prospectReplyPlaceholder")}
              maxLength={1000}
              className="text-xs"
            />
          </label>
          <Input
            label={t("harvey.objectiveLabel")}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder={t("harvey.objectivePlaceholder")}
            maxLength={300}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRegenerate}
            disabled={generateDrafts.isPending}
            className="w-full rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {generateDrafts.isPending
              ? t("harvey.generating")
              : t("harvey.generateWithContext")}
          </Button>
        </div>
      )}

      {drafts.length > 0 && (
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
              ? t("harvey.generating")
              : t("harvey.messagePlaceholder")
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
            <span>{t("harvey.autoStageLabel")}:</span>
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
                {DEMO_LEAD_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {t(`stages.${stage}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {t("harvey.sendDisclaimer")}
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
        {t("harvey.sendAndAdvance", {
          stage: t(`stages.${nextStage}`),
        })}
      </Button>
    </section>
  );
}
