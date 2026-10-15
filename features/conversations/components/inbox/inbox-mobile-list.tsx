"use client";

/**
 * Inbox en el teléfono (< lg), según el diseño móvil: buscador, bandejas
 * en pastillas con su contador y filas grandes (avatar, tiempo, estado y no
 * leídos). Tocar una abre el hilo a pantalla completa.
 */

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { cn } from "@/lib/utils";
import { CONTROL_BADGE } from "./control-badge";
import type { InboxTab } from "./inbox-tabs";
import type { ConversationListItem, ConversationSummary } from "../../types";

interface InboxMobileListProps {
  activeTab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  summary: ConversationSummary | undefined;
  conversations: ConversationListItem[];
  isLoading: boolean;
  /** La carga falló: se muestra el error, no "no hay conversaciones". */
  isError: boolean;
  onRetry: () => void;
  isConnected: boolean;
  onSelect: (sessionId: string) => void;
  onSearch: (query: string) => void;
}

export function InboxMobileList({
  activeTab,
  onTabChange,
  summary,
  conversations,
  isLoading,
  isError,
  onRetry,
  isConnected,
  onSelect,
  onSearch,
}: InboxMobileListProps) {
  const t = useTranslations("inbox");
  const format = useFormatter();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const tabs: Array<{ id: InboxTab; label: string; count?: number }> = [
    { id: "waiting", label: t("tabs.waiting"), count: summary?.pendingHuman },
    { id: "mine", label: t("tabs.mine"), count: summary?.mine },
    { id: "unassigned", label: t("tabs.unassigned"), count: summary?.unassigned },
    { id: "all", label: t("tabs.all") },
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

        <label className="relative block">
          <Search
            aria-hidden
            className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            aria-label={t("list.searchPlaceholder")}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-[42px] pr-3.5 text-[15px] text-slate-900 outline-none focus:border-indigo-400"
          />
        </label>

        <div
          role="tablist"
          aria-label={t("mobile.trays")}
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6"
        >
          {tabs.map((tab) => {
            const on = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
                  on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                      on ? "bg-white text-slate-900" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
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
            const unread = conversation.unreadCount > 0;
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
                        {format.relativeTime(new Date(conversation.lastMessageAt))}
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
        </ul>
      )}
    </div>
  );
}
