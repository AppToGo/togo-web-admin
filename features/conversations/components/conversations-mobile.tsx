"use client";

/**
 * "Sin pedido" en el teléfono (< lg), según el diseño móvil: filtros por
 * resultado en pastillas, tarjetas por conversación y, al tocar una, el
 * hilo de solo lectura a pantalla completa con "Ver cliente" y "Reabrir en
 * Inbox".
 */

import { useFormatter, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { MobileScreen } from "@/components/layout/MobileScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { ConversationOutcomeBadge } from "./conversation-outcome-badge";
import { ConversationThreadView } from "./conversation-thread/conversation-thread-view";
import { useConversation } from "../hooks/useConversation";
import type {
  ConversationListItem,
  ConversationOutcome,
  PaginationMeta,
} from "../types";

type OutcomeFilter = "ALL" | ConversationOutcome;

interface ConversationsMobileListProps {
  outcomes: ConversationOutcome[];
  outcomeFilter: OutcomeFilter;
  onOutcomeChange: (outcome: OutcomeFilter) => void;
  conversations: ConversationListItem[];
  isLoading: boolean;
  isError: boolean;
  pagination: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onSelect: (sessionId: string) => void;
}

/** Cuándo se cerró (o habló por última vez): "hoy 11:52", "12 oct". */
function useWhen() {
  const t = useTranslations("conversations");
  const format = useFormatter();
  return (iso: string) => {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString()
      ? t("mobile.today", { time: format.dateTime(date, { hour: "2-digit", minute: "2-digit" }) })
      : format.dateTime(date, { day: "numeric", month: "short" });
  };
}

export function ConversationsMobileList({
  outcomes,
  outcomeFilter,
  onOutcomeChange,
  conversations,
  isLoading,
  isError,
  pagination,
  onPageChange,
  onSelect,
}: ConversationsMobileListProps) {
  const t = useTranslations("conversations");
  const when = useWhen();
  const filters: Array<{ id: OutcomeFilter; label: string }> = [
    { id: "ALL", label: t("filters.allOutcomes") },
    ...outcomes.map((outcome) => ({ id: outcome, label: t(`mobile.outcomeShort.${outcome}`) })),
  ];

  return (
    <div className="-mx-4 -mt-4 flex flex-col sm:-mx-6 sm:-mt-6" data-testid="conversations-mobile-list">
      <div className="flex flex-col gap-2.5 border-b border-slate-200/70 bg-white px-4 pb-3 pt-1 sm:px-6">
        <span className="text-xs text-slate-500">{t("page.subtitle")}</span>
        <div
          role="group"
          aria-label={t("filters.outcome")}
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6"
        >
          {filters.map((filter) => {
            const on = filter.id === outcomeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={on}
                onClick={() => onOutcomeChange(filter.id)}
                className={cn(
                  "flex h-9 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold transition-colors",
                  on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3 sm:px-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[86px] rounded-[14px]" />
          ))
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="font-medium text-slate-900">{t("error.title")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("error.description")}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-medium text-slate-900">{t("empty.title")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("empty.description")}</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className="flex flex-col gap-1.5 rounded-[14px] bg-white px-3.5 py-3 text-left"
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900">
                  {conversation.customer?.name ?? conversation.phoneNumber}
                </span>
                <ConversationOutcomeBadge
                  outcome={conversation.outcome}
                  status={conversation.status}
                  className="shrink-0 rounded-full text-[11px] font-bold"
                />
              </span>
              {conversation.customer?.name && (
                <span className="truncate text-sm text-slate-600">{conversation.phoneNumber}</span>
              )}
              <span className="text-xs text-slate-500">
                {when(conversation.closedAt ?? conversation.lastMessageAt)} ·{" "}
                {t("mobile.messages", { count: conversation.messageCount })}
              </span>
            </button>
          ))
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => onPageChange(pagination.page - 1)}
              aria-label={t("mobile.previousPage")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-slate-500">
              {t("mobile.pageOf", { page: pagination.page, total: pagination.totalPages })}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
              aria-label={t("mobile.nextPage")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationMobileReadonlyProps {
  conversation: ConversationListItem;
  onBack: () => void;
}

/** Hilo de solo lectura de una conversación cerrada (teléfono). */
export function ConversationMobileReadonly({
  conversation,
  onBack,
}: ConversationMobileReadonlyProps) {
  const t = useTranslations("conversations");
  const when = useWhen();
  const { hasPermission } = useMyPermissions();
  const canOpenInbox = hasPermission("conversation.view");
  const customerId = conversation.customer?.id;

  return (
    <MobileScreen
      hiddenFrom="lg"
      onBack={onBack}
      backLabel={t("mobile.back")}
      testId="conversation-mobile-readonly"
      title={
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-bold text-slate-900">
            {conversation.customer?.name ?? conversation.phoneNumber}
          </span>
          <span className="truncate text-xs text-slate-500">
            {t(`status.${conversation.status}`)} ·{" "}
            {when(conversation.closedAt ?? conversation.lastMessageAt)} ·{" "}
            {t("mobile.messages", { count: conversation.messageCount })}
          </span>
        </span>
      }
      actions={
        <ConversationOutcomeBadge
          outcome={conversation.outcome}
          status={conversation.status}
          className="shrink-0 rounded-full text-xs font-bold"
        />
      }
      bodyClassName="px-3 py-3.5"
      footer={
        (customerId || canOpenInbox) && (
          <div
            className={cn(
              "grid gap-2 px-3 pb-2 pt-3",
              customerId && canOpenInbox ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {customerId && (
              <Link
                href={`/dashboard/customers/${customerId}`}
                className="flex h-12 items-center justify-center rounded-[14px] border border-slate-200 text-[15px] font-semibold text-slate-700"
              >
                {t("mobile.viewCustomer")}
              </Link>
            )}
            {canOpenInbox && (
              <Link
                href={`/dashboard/inbox?session=${conversation.id}`}
                className="flex h-12 items-center justify-center rounded-[14px] bg-indigo-600 text-[15px] font-semibold text-white"
              >
                {t("mobile.reopenInInbox")}
              </Link>
            )}
          </div>
        )
      }
    >
      {/* El hilo crece con el cuerpo de la pantalla, que es el que hace scroll. */}
      <ConversationThreadReadonly sessionId={conversation.id} />
    </MobileScreen>
  );
}

function ConversationThreadReadonly({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useConversation(sessionId);
  return <ConversationThreadView data={data} isLoading={isLoading} scrollable={false} />;
}
