"use client";

/**
 * Inbox en el teléfono (< lg), según el diseño móvil: buscador, bandejas
 * en pastillas con su contador y filas grandes (avatar, tiempo, estado y no
 * leídos). Tocar una abre el hilo a pantalla completa. Scroll infinito:
 * llegan de a 20 y el resto se pide al acercarse al final.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { SearchField } from "@/components/ui/search-field";
import { PillGroup } from "@/components/ui/pill-group";
import { cn } from "@/lib/utils";
import { CONTROL_BADGE } from "./control-badge";
import { useListTime } from "../../hooks/useListTime";
import { useLoadMoreOnScroll } from "../../hooks/useLoadMoreOnScroll";
import type { ConversationListItem, ConversationSummary, InboxView } from "../../types";

interface InboxMobileListProps {
  view: InboxView;
  onViewChange: (view: InboxView) => void;
  summary: ConversationSummary | undefined;
  conversations: ConversationListItem[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
  /** La carga falló: se muestra el error, no "no hay conversaciones". */
  isError: boolean;
  onRetry: () => void;
  isConnected: boolean;
  onSelect: (sessionId: string) => void;
  onSearch: (query: string) => void;
}

export function InboxMobileList({
  view,
  onViewChange,
  summary,
  conversations,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  isError,
  onRetry,
  isConnected,
  onSelect,
  onSearch,
}: InboxMobileListProps) {
  const t = useTranslations("inbox");
  const listTime = useListTime();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // En el teléfono la lista scrollea con la página: el root es el viewport.
  const sentinelRef = useLoadMoreOnScroll({
    hasNextPage,
    isFetchingNextPage,
    hasError: isFetchNextPageError,
    onLoadMore,
    itemCount: conversations.length,
  });

  const tabs: Array<{ id: InboxView; label: string; count?: number }> = [
    { id: "all", label: t("tabs.all") },
    { id: "waiting", label: t("tabs.waiting"), count: summary?.pendingHuman },
    { id: "mine", label: t("tabs.mine"), count: summary?.mine },
    { id: "unassigned", label: t("tabs.unassigned"), count: summary?.unassigned },
  ];

  return (
    <div className="-mx-4 -mt-4 flex flex-col sm:-mx-6 sm:-mt-6" data-testid="inbox-mobile-list">
      <div className="flex flex-col gap-2.5 border-b border-slate-200/70 bg-white px-4 pb-3 pt-1 sm:px-6">
        {/* El título ya está en la barra superior; acá solo el estado en vivo. */}
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs",
            isConnected ? "text-slate-500" : "text-amber-700"
          )}
          title={t("connection.tooltip")}
        >
          <span
            aria-hidden
            className={cn(
              "h-[7px] w-[7px] rounded-full",
              isConnected ? "bg-emerald-600" : "bg-amber-500"
            )}
          />
          {isConnected ? t("connection.connected") : t("connection.disconnected")}
        </span>

        <SearchField value={searchValue} onChange={setSearchValue} placeholder={t("list.searchPlaceholder")} />

        <PillGroup
          label={t("mobile.trays")}
          variant="tabs"
          value={view}
          onChange={onViewChange}
          options={tabs}
          className="-mx-4 px-4 sm:-mx-6 sm:px-6"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 border-b border-slate-100 px-4 py-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mx-6 mt-12 flex flex-col items-center gap-3 text-center" role="alert">
          <p className="text-[15px] font-medium text-slate-900">{t("mobile.loadError")}</p>
          <button
            type="button"
            onClick={onRetry}
            className="h-10 rounded-full bg-white px-4 text-sm font-semibold text-indigo-700 shadow-card-sm"
          >
            {t("mobile.retry")}
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <p className="mx-6 mt-12 text-center text-[15px] text-slate-500">{t("list.empty")}</p>
      ) : (
        <ul>
          {conversations.map((conversation) => {
            const name = conversation.customer?.name ?? null;
            // No leída solo si sigue abierta: en una cerrada ya no hay nada
            // que responder (mismo criterio para el fondo, la hora y el badge).
            const unread = conversation.status === "OPEN" && conversation.unreadCount > 0;
            const badge = CONTROL_BADGE[conversation.control];
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    "flex min-h-[76px] w-full gap-3 border-b border-slate-100 px-4 py-3 text-left",
                    unread ? "bg-white" : "bg-slate-50"
                  )}
                >
                  <InitialsAvatar
                    name={name}
                    seed={conversation.customer?.id ?? conversation.phoneNumber}
                    size="md"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900">
                        {name ?? conversation.phoneNumber}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          unread ? "text-indigo-700" : "text-slate-500"
                        )}
                      >
                        {listTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                    {name && (
                      <span className="truncate text-sm text-slate-600">
                        {conversation.phoneNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "flex h-[22px] items-center rounded-full px-2 text-[11px] font-bold",
                          badge
                        )}
                      >
                        {t(`control.${conversation.control}`)}
                      </span>
                      {unread && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white tabular-nums">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          <li ref={sentinelRef} aria-hidden className="h-px" />
          {isFetchingNextPage && (
            <li className="flex justify-center py-3" role="status" aria-label={t("list.loadingMore")}>
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </li>
          )}
          {isFetchNextPageError && !isFetchingNextPage && (
            <li className="flex flex-col items-center gap-2 py-4 text-center" role="alert">
              <p className="text-sm text-slate-500">{t("list.loadMoreError")}</p>
              <button
                type="button"
                onClick={onLoadMore}
                className="h-9 rounded-full bg-white px-4 text-sm font-semibold text-indigo-700 shadow-card-sm"
              >
                {t("mobile.retry")}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
