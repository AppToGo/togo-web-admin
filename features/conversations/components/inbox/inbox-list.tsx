"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { InboxTabs, type InboxTab } from "./inbox-tabs";
import { InboxListItem } from "./inbox-list-item";
import type { ConversationListItem, ConversationSummary } from "../../types";

interface InboxListProps {
  activeTab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  summary: ConversationSummary | undefined;
  conversations: ConversationListItem[];
  isLoading: boolean;
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onSearch: (query: string) => void;
}

export function InboxList({
  activeTab,
  onTabChange,
  summary,
  conversations,
  isLoading,
  selectedSessionId,
  onSelect,
  onSearch,
}: InboxListProps) {
  const t = useTranslations("inbox");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="relative">
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

      <InboxTabs active={activeTab} onChange={onTabChange} summary={summary} />

      <div className="-mx-1 flex-1 min-h-0 overflow-y-auto px-1 space-y-1">
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
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            {t("list.empty")}
          </p>
        ) : (
          conversations.map((conversation) => (
            <InboxListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedSessionId}
              onClick={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
