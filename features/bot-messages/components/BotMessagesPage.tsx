"use client";

/**
 * "Mensajes del asistente" (plan bot natural, T22).
 *
 * Lista los mensajes del camino feliz con lo que el bot dice hoy (el
 * template de la industria o lo que el negocio ya publicó). Cada uno se
 * edita a mano; "Editar con IA" es opcional y llena el borrador de todos
 * con el estilo de 3 ejemplos. Nada llega a los clientes hasta publicar.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ChevronDown,
  Crown,
  Info,
  Loader2,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import { extractErrorMessage } from "@/lib/error.utils";
import { cn } from "@/lib/utils";
import { useCurrentBusiness } from "@/features/business";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { UpgradePlanModal } from "@/features/subscription/components/UpgradePlanModal";
import {
  useBotMessages,
  useDiscardBotMessagesDraft,
  usePublishBotMessages,
} from "../hooks/useBotMessages";
import type { BotMessageStage } from "../types/bot-messages.types";
import { BotMessageCard } from "./BotMessageCard";
import { EditWithAiDialog } from "./EditWithAiDialog";

export const BOT_MESSAGES_PERMISSION = "bot_messages.manage";

/** Mismo criterio que la voz del asistente (T18): Pro y Enterprise. */
const canCustomize = (plan: number | undefined) => plan === 3 || plan === 4;

export function BotMessagesPage() {
  const t = useTranslations("settings.botMessages");
  const tc = useTranslations("common");
  const { data: business, isLoading: businessLoading } = useCurrentBusiness();
  const jwtPlan = useAuthStore((state) => state.user?.subscriptionPlan);
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const allowedPlan = canCustomize(business?.subscriptionPlan ?? jwtPlan);
  const allowed = !permissionsLoading && hasPermission(BOT_MESSAGES_PERMISSION);

  const businessId = business?.id ?? "";
  const catalog = useBotMessages(
    allowedPlan && allowed ? business?.id : undefined
  );
  const publish = usePublishBotMessages(businessId);
  const discard = useDiscardBotMessagesDraft(businessId);
  const [aiOpen, setAiOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<BotMessageStage>>(new Set());

  const header = (
    <div className="mb-6 flex items-center gap-4">
      <Link href="/dashboard/settings/general/business">
        <Button variant="ghost" size="icon" aria-label={t("back")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <MessagesSquare className="h-6 w-6 text-indigo-600" />
          {t("title")}
        </h1>
        <p className="text-slate-500">{t("subtitle")}</p>
      </div>
    </div>
  );

  if (
    businessLoading ||
    permissionsLoading ||
    (catalog.isLoading && allowed && allowedPlan)
  ) {
    return (
      <>
        {header}
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        {header}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("noPermission.title")}</AlertTitle>
          <AlertDescription>{t("noPermission.description")}</AlertDescription>
        </Alert>
      </>
    );
  }

  if (!allowedPlan) {
    return (
      <>
        {header}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-900">{t("locked.description")}</p>
          <Button
            type="button"
            size="sm"
            className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setUpgradeOpen(true)}
          >
            <Crown className="mr-1.5 h-3.5 w-3.5" />
            {t("locked.cta")}
          </Button>
        </div>
        <UpgradePlanModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
        />
      </>
    );
  }

  if (catalog.isError || !catalog.data) {
    return (
      <>
        {header}
        <Alert variant="destructive">
          <AlertTitle>{t("errors.loadTitle")}</AlertTitle>
          <AlertDescription>
            {extractErrorMessage(catalog.error, t("errors.load"))}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  const data = catalog.data;
  const failedIds = new Set(data.latestRun?.failedIds ?? []);
  const draftCount = data.stages
    .flatMap((s) => s.messages)
    .filter((m) => m.draft).length;
  const blocking = data.stages
    .flatMap((s) => s.messages)
    .some((m) => m.draft && m.issues.some((i) => i.severity === "error"));

  const toggleStage = (stage: BotMessageStage) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });

  const handlePublish = async () => {
    try {
      const result = await publish.mutateAsync();
      toast.success(t("publish.success", { count: result.published }));
    } catch (err) {
      toast.error(extractErrorMessage(err, t("publish.error")));
    }
  };

  const handleDiscard = async () => {
    try {
      await discard.mutateAsync();
      setConfirmDiscard(false);
      toast.success(t("discard.success"));
    } catch (err) {
      toast.error(extractErrorMessage(err, t("discard.error")));
    }
  };

  return (
    <div className="space-y-6">
      {header}

      <div className="flex gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div className="space-y-1 text-sm text-indigo-900">
          <p className="font-medium">{t("whyVersions.title")}</p>
          <p>{t("whyVersions.body")}</p>
        </div>
      </div>

      <Card variant="glass">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{t("ai.cardTitle")}</p>
            <p className="text-sm text-slate-500">
              {data.aiAvailable ? t("ai.cardDescription") : t("ai.unavailable")}
            </p>
          </div>
          <Button
            type="button"
            disabled={!data.aiAvailable || data.generationsLeftToday === 0}
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {t("ai.open")}
          </Button>
        </CardContent>
      </Card>

      {data.stages.map(({ stage, messages }) => {
        const isCollapsed = collapsed.has(stage);
        return (
          <Card key={stage} variant="glass">
            <button
              type="button"
              onClick={() => toggleStage(stage)}
              className="flex w-full items-center justify-between gap-3 p-6 text-left"
              aria-expanded={!isCollapsed}
            >
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {t(`stages.${stage}`)}
                </p>
                <p className="text-sm text-slate-500">
                  {t("messageCount", { count: messages.length })}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-slate-400 transition-transform",
                  !isCollapsed && "rotate-180"
                )}
              />
            </button>
            {!isCollapsed && (
              <CardContent className="space-y-3">
                {messages.map((message) => (
                  <BotMessageCard
                    key={message.id}
                    businessId={businessId}
                    message={message}
                    voice={data.voice}
                    aiAvailable={data.aiAvailable}
                    aiFailed={failedIds.has(message.id)}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {data.hasDraft && (
        <div className="sticky bottom-0 z-30 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              {blocking
                ? t("publish.blocked")
                : t("publish.pending", { count: draftCount })}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={discard.isPending || publish.isPending}
                onClick={() => setConfirmDiscard(true)}
              >
                {t("discard.button")}
              </Button>
              <Button
                type="button"
                disabled={blocking || publish.isPending || discard.isPending}
                isLoading={publish.isPending}
                onClick={handlePublish}
              >
                {t("publish.button")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("discard.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("discard.confirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDiscard(false)}
            >
              {tc("buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={discard.isPending}
              isLoading={discard.isPending}
              onClick={handleDiscard}
            >
              {t("discard.button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {aiOpen && (
        <EditWithAiDialog
          businessId={businessId}
          catalog={data}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}
