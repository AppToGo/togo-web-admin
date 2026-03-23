"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { X, CheckSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAllPages?: () => void;
  className?: string;
}

export function SelectionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAllPages,
  className,
}: SelectionBarProps) {
  const t = useTranslations("customers");

  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between px-4 py-3",
        "bg-indigo-50 border border-indigo-100 rounded-lg",
        "shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
          <Users className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <span className="font-medium text-indigo-900">
            {selectedCount === totalCount
              ? t("selection.allSelected", { count: totalCount })
              : t("selection.selected", { count: selectedCount })}
          </span>
          {selectedCount < totalCount && onSelectAllPages && (
            <button
              onClick={onSelectAllPages}
              className="ml-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
            >
              {t("selection.selectAllPages", { count: totalCount })}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100"
        >
          <X className="h-4 w-4 mr-1.5" />
          {t("selection.clear")}
        </Button>
      </div>
    </div>
  );
}
