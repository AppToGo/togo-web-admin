"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversationFunnel } from "../../hooks/useConversationFunnel";
import type { GetConversationFunnelParams } from "../../types";
import { FunnelKpis } from "./funnel-kpis";
import { FunnelAbandonmentCard } from "./funnel-abandonment-card";
import { FunnelOutcomesCard } from "./funnel-outcomes-card";
import { FunnelUnderstandingCard } from "./funnel-understanding-card";
import { FunnelParaphraseCard } from "./funnel-paraphrase-card";

interface ConversationFunnelViewProps {
  params: GetConversationFunnelParams;
}

/** Embudo conversacional del bot (plan bot natural, T20). */
export function ConversationFunnelView({
  params,
}: ConversationFunnelViewProps) {
  const t = useTranslations("conversations.funnel");
  const { data, isLoading, isError } = useConversationFunnel(params);

  if (isLoading) return <ConversationFunnelSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="font-semibold text-slate-900">{t("error.title")}</p>
        <p className="text-sm text-slate-500 mt-1">{t("error.description")}</p>
      </div>
    );
  }

  // Las señales por mensaje empezaron a contarse con T20: un período
  // anterior tiene sesiones pero ningún mensaje registrado.
  const noTurnHistory =
    data.turns.totals.turns === 0 && data.sessions.total > 0;

  return (
    <div className="space-y-6">
      <FunnelKpis data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelAbandonmentCard sessions={data.sessions} />
        <FunnelOutcomesCard sessions={data.sessions} />
      </div>

      {noTurnHistory && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{t("noTurnHistory")}</p>
        </div>
      )}

      <FunnelUnderstandingCard turns={data.turns} />

      {/* T21: solo si algún aviso se mandó a reescribir en el período. */}
      {data.paraphrase && data.paraphrase.requested > 0 && (
        <FunnelParaphraseCard paraphrase={data.paraphrase} />
      )}

      <p className="text-xs text-slate-400">
        {t("timeZoneNote", { timeZone: data.period.timeZone })}
      </p>
    </div>
  );
}

export function ConversationFunnelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
