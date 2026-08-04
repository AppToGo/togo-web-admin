"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Store, Wifi, WifiOff } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useHasBusiness, useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { cn } from "@/lib/utils";
import {
  useInboxConversations,
  useInboxSummary,
  useConversationsRealtime,
} from "@/features/conversations/hooks";
import { InboxLayout } from "@/features/conversations/components/inbox/inbox-layout";
import { InboxList } from "@/features/conversations/components/inbox/inbox-list";
import { InboxThreadPanel } from "@/features/conversations/components/inbox/inbox-thread-panel";
import { InboxEmptyState } from "@/features/conversations/components/inbox/inbox-empty-state";
import type { InboxTab } from "@/features/conversations/components/inbox/inbox-tabs";
import type { GetConversationsParams } from "@/features/conversations/types";

function tabFilters(tab: InboxTab): GetConversationsParams {
  switch (tab) {
    case "waiting":
      return { control: ["PENDING_HUMAN"] };
    case "mine":
      return { assignedTo: "me" };
    case "unassigned":
      return { control: ["HUMAN"], assignedTo: "unassigned" };
    case "all":
    default:
      return {};
  }
}

export default function InboxPage() {
  const t = useTranslations("inbox");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const canViewInbox = !permissionsLoading && hasPermission("conversation.view");

  const [activeTab, setActiveTab] = useState<InboxTab>("waiting");
  const [search, setSearch] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Ajuste de estado durante el render (no un useEffect, mismo patrón que
  // la página de "sin pedido" de Fase B): sin esto, un SUPER_ADMIN que
  // cambia de negocio con el selector global mientras tiene un hilo
  // abierto se queda con un sessionId de OTRO negocio pasado al panel.
  const effectiveBusinessId = useEffectiveBusinessId();
  const [prevBusinessId, setPrevBusinessId] = useState(effectiveBusinessId);
  if (effectiveBusinessId !== prevBusinessId) {
    setPrevBusinessId(effectiveBusinessId);
    setSelectedSessionId(null);
  }

  const { isConnected } = useConversationsRealtime(canViewInbox);
  const { data: summary } = useInboxSummary(canViewInbox);
  const { data: conversations, isLoading, isAllBusinessesSelected } =
    useInboxConversations(
      { ...tabFilters(activeTab), q: search || undefined },
      isConnected,
      canViewInbox
    );

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{t("title")}</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (permissionsLoading) {
    return <DashboardLayout>{null}</DashboardLayout>;
  }

  if (!hasPermission("conversation.view")) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("accessDeniedTitle")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("accessDeniedDescription")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isAllBusinessesSelected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("selectBusinessTitle")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("selectBusinessDescription")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
            <p className="text-sm text-slate-500">{t("subtitle")}</p>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isConnected ? "text-emerald-600" : "text-amber-600"
            )}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected ? t("connection.connected") : t("connection.disconnected")}
          </div>
        </div>

        <InboxLayout
          list={
            <InboxList
              activeTab={activeTab}
              onTabChange={setActiveTab}
              summary={summary}
              conversations={conversations}
              isLoading={isLoading}
              selectedSessionId={selectedSessionId}
              onSelect={setSelectedSessionId}
              onSearch={setSearch}
            />
          }
          panel={
            selectedSessionId ? (
              // `key` fuerza un remount completo al cambiar de conversación:
              // sin esto, el estado local de los diálogos de asignar/cerrar
              // (InboxThreadHeader) sobrevive el cambio de sessionId y puede
              // confirmarse contra la conversación equivocada.
              <InboxThreadPanel key={selectedSessionId} sessionId={selectedSessionId} />
            ) : (
              <InboxEmptyState />
            )
          }
        />
      </div>
    </DashboardLayout>
  );
}
