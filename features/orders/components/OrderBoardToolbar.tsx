"use client";

import { useTranslations } from "next-intl";
import { Columns3, Focus, LayoutList, Rows3, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardDensity } from "./OrderCard";
import { HoverTooltip } from "./HoverTooltip";

export type BoardViewMode = "board" | "focus" | "list";

interface OrderBoardToolbarProps {
  view: BoardViewMode;
  onViewChange: (view: BoardViewMode) => void;
  density: CardDensity;
  onDensityChange: (density: CardDensity) => void;
}

const VIEW_OPTIONS: { value: BoardViewMode; icon: typeof Columns3 }[] = [
  { value: "board", icon: Columns3 },
  { value: "focus", icon: Focus },
  { value: "list", icon: ListTree },
];

const DENSITY_OPTIONS: { value: CardDensity; icon: typeof Columns3 }[] = [
  { value: "regular", icon: LayoutList },
  { value: "compact", icon: Rows3 },
];

function segmentClass(active: boolean) {
  return cn(
    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
    active
      ? "bg-indigo-50 text-indigo-600"
      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
  );
}

/**
 * Board view selector (Board / By status / List) + card density. Lives in
 * the page header, next to the filters button.
 */
export function OrderBoardToolbar({
  view,
  onViewChange,
  density,
  onDensityChange,
}: OrderBoardToolbarProps) {
  const t = useTranslations("orders");

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="flex items-center gap-0.5 p-1 rounded-2xl bg-white/70 border border-white/60"
        role="tablist"
        aria-label={t("boardView.label")}
      >
        {VIEW_OPTIONS.map(({ value, icon: Icon }) => (
          <HoverTooltip key={value} content={t(`boardView.${value}`)} side="bottom">
            <button
              type="button"
              role="tab"
              aria-selected={view === value}
              aria-label={t(`boardView.${value}`)}
              onClick={() => onViewChange(value)}
              className={segmentClass(view === value)}
            >
              <Icon className="w-4 h-4" />
            </button>
          </HoverTooltip>
        ))}
      </div>

      {view !== "list" && (
        <div
          className="flex items-center gap-0.5 p-1 rounded-2xl bg-white/70 border border-white/60"
          role="tablist"
          aria-label={t("density.label")}
        >
          {DENSITY_OPTIONS.map(({ value, icon: Icon }) => (
            <HoverTooltip key={value} content={t(`density.${value}`)} side="bottom">
              <button
                type="button"
                role="tab"
                aria-selected={density === value}
                aria-label={t(`density.${value}`)}
                onClick={() => onDensityChange(value)}
                className={segmentClass(density === value)}
              >
                <Icon className="w-4 h-4" />
              </button>
            </HoverTooltip>
          ))}
        </div>
      )}
    </div>
  );
}
