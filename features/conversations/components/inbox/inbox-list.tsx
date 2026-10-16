"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { InboxFilters } from "./inbox-filters";
import { InboxListItem } from "./inbox-list-item";
import { useLoadMoreOnScroll } from "../../hooks/useLoadMoreOnScroll";
import type {
  ConversationListItem,
  ConversationSummary,
  InboxFiltersValue,
} from "../../types";

interface InboxListProps {
  filters: InboxFiltersValue;
  onFiltersChange: (filters: InboxFiltersValue) => void;
  summary: ConversationSummary | undefined;
  conversations: ConversationListItem[];
  isLoading: boolean;
  /** La primera carga falló: se muestra el error, no "no hay conversaciones". */
  isError: boolean;
  onRetry: () => void;
  /** Cualquier fetch en curso (ver `useLoadMoreOnScroll`). */
  isFetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onSearch: (query: string) => void;
}

export function InboxList({
  filters,
  onFiltersChange,
  summary,
  conversations,
  isLoading,
  isError,
  onRetry,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  selectedSessionId,
  onSelect,
  onSearch,
}: InboxListProps) {
  const t = useTranslations("inbox");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 300);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const loadMore = useLoadMoreOnScroll({
    hasNextPage,
    isFetching,
    hasError: isFetchNextPageError,
    onLoadMore,
    rootRef: scrollRef,
    itemCount: conversations.length,
  });

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            aria-label={t("list.searchPlaceholder")}
            className="h-11 rounded-card border-0 bg-white pl-10 shadow-none"
          />
        </div>
        <InboxFilters value={filters} onChange={onFiltersChange} summary={summary} />
      </div>

      <div ref={scrollRef} className="-mx-1 flex-1 min-h-0 overflow-y-auto px-1 space-y-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton className="h-10 w-10 rounded-full bg-white/70" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3 bg-white/70" />
                <Skeleton className="h-2.5 w-1/2 bg-white/70" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-3 py-6 text-center" role="alert">
            <p className="text-sm font-medium text-slate-900">{t("list.loadError")}</p>
            <button
              type="button"
              onClick={onRetry}
              disabled={isFetching}
              className="inline-flex h-9 items-center gap-2 rounded-badge bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("list.retry")}
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            {t("list.empty")}
          </p>
        ) : (
          <>
            {conversations.map((conversation) => (
              <InboxListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedSessionId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
            <div ref={loadMore.sentinelRef} aria-hidden className="h-px" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-3" role="status" aria-label={t("list.loadingMore")}>
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
            {loadMore.isStuck && !isFetchingNextPage && (
              <div className="flex flex-col items-center gap-2 py-3 text-center" role="alert">
                <p className="text-xs text-slate-500">{t("list.loadMoreError")}</p>
                <button
                  type="button"
                  onClick={loadMore.retry}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  {t("list.retry")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
