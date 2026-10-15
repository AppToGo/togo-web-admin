"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Inbox, Lock, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useHasBusiness, useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { cn } from "@/lib/utils";
import {
  useInboxConversations,
  useInboxSummary,
} from "@/features/conversations/hooks";
import { useConversationsConnected } from "@/stores/realtime-status.store";
import { InboxLayout } from "@/features/conversations/components/inbox/inbox-layout";
import { InboxList } from "@/features/conversations/components/inbox/inbox-list";
import { InboxThreadPanel } from "@/features/conversations/components/inbox/inbox-thread-panel";
import { InboxEmptyState } from "@/features/conversations/components/inbox/inbox-empty-state";
import { InboxMobileList } from "@/features/conversations/components/inbox/inbox-mobile-list";
import { InboxMobileThread } from "@/features/conversations/components/inbox/inbox-mobile-thread";
import { ConversationsMobileNav } from "@/features/conversations/components/conversations-mobile-nav";
import { useIsBelowDesktop } from "@/hooks/useIsMobile";
import { useUrlParamState } from "@/hooks/useUrlParamState";
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
  // Teléfono y tablet vertical (< lg): una pantalla a la vez — la lista, o
  // el hilo a pantalla completa (diseño móvil).
  const isBelowDesktop = useIsBelowDesktop();

  // El hilo abierto vive en `?session=<id>`: sirve de deep-link ("Abrir
  // conversación" desde el detalle del cliente) y, en el teléfono, abrirlo
  // agrega una entrada al historial para que el atrás del sistema vuelva a
  // la lista en vez de salir del Inbox.
  const [sessionParam, openSession, closeSession] = useUrlParamState("session");
  const selectSession = (sessionId: string) =>
    openSession(sessionId, { push: isBelowDesktop });

  // Ajuste de estado durante el render (no un useEffect, mismo patrón que
  // la página de "sin pedido" de Fase B): sin esto, un SUPER_ADMIN que
  // cambia de negocio con el selector global mientras tiene un hilo
  // abierto se queda con un sessionId de OTRO negocio pasado al panel.
  const effectiveBusinessId = useEffectiveBusinessId();
  const [prevBusinessId, setPrevBusinessId] = useState(effectiveBusinessId);
  const [staleSessionId, setStaleSessionId] = useState<string | null>(null);
  if (effectiveBusinessId !== prevBusinessId) {
    setPrevBusinessId(effectiveBusinessId);
    setStaleSessionId(sessionParam);
  }
  const selectedSessionId = sessionParam !== staleSessionId ? sessionParam : null;

  // El socket lo abre DashboardRealtime (layout del dashboard).
  const isConnected = useConversationsConnected();
  const { data: summary } = useInboxSummary(canViewInbox);
  const {
    data: conversations,
    isLoading,
    isError,
    refetch,
    isAllBusinessesSelected,
  } =
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

  if (isBelowDesktop) {
    return (
      <DashboardLayout>
        <InboxMobileList
          activeTab={activeTab}
          onTabChange={setActiveTab}
          summary={summary}
          conversations={conversations}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          isConnected={isConnected}
          onSelect={selectSession}
          onSearch={setSearch}
        />
        <ConversationsMobileNav />
        {selectedSessionId && (
          <InboxMobileThread
            key={selectedSessionId}
            sessionId={selectedSessionId}
            onBack={closeSession}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("subtitle")}</p>
          </div>
          <span
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-badge bg-white/80 px-3.5 text-sm font-medium",
              isConnected ? "text-emerald-700" : "text-amber-700"
            )}
            // Este indicador es sobre el socket del navegador con el
            // backend de TOGO (para que los mensajes/estados nuevos
            // aparezcan sin refrescar) — NO sobre si el negocio tiene un
            // número de WhatsApp Business conectado. El texto y el title
            // lo dejan explícito para no confundir a un negocio sin
            // WhatsApp conectado, que vería "Conectado" y asumiría que se
            // refiere a su WhatsApp.
            title={t("connection.tooltip")}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected
                  ? "bg-emerald-500 ring-3 ring-emerald-500/20"
                  : "bg-amber-500 ring-3 ring-amber-500/20"
              )}
            />
            {isConnected ? t("connection.live") : t("connection.disconnected")}
          </span>
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
              onSelect={selectSession}
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
