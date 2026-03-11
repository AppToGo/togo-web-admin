"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { Eye, EyeOff, PanelRight, PanelRightClose } from "lucide-react";
import { generateColumnColors, generateColumnLabels } from "../theme";
import type { OrderStatus } from "../types";

const COOKIE_KEY_VISIBILITY = "kanban-column-visibility";
const COOKIE_KEY_SIDEBAR = "kanban-sidebar-open";

// Estados visibles en el Kanban (mismo orden que DEFAULT_KANBAN_STATUSES)
const KANBAN_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "ON_THE_WAY",
  "COMPLETED",
];

export interface ColumnVisibilityConfig {
  CONFIRMED: boolean;
  IN_PROGRESS: boolean;
  READY: boolean;
  ON_THE_WAY: boolean;
  COMPLETED: boolean;
}

// Labels generados automáticamente desde el theme
const COLUMN_LABELS: Record<keyof ColumnVisibilityConfig, string> = 
  generateColumnLabels(KANBAN_STATUSES) as Record<keyof ColumnVisibilityConfig, string>;

// Colores generados automáticamente desde el theme
const COLUMN_COLORS: Record<keyof ColumnVisibilityConfig, string> = 
  generateColumnColors(KANBAN_STATUSES) as Record<keyof ColumnVisibilityConfig, string>;

const defaultVisibility: ColumnVisibilityConfig = {
  CONFIRMED: true,
  IN_PROGRESS: true,
  READY: true,
  ON_THE_WAY: true,
  COMPLETED: true,
};

interface ColumnVisibilityBarProps {
  onVisibilityChange?: (visibility: ColumnVisibilityConfig) => void;
  isSidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export function ColumnVisibilityBar({
  onVisibilityChange,
  isSidebarOpen = true,
  onSidebarToggle,
}: ColumnVisibilityBarProps) {
  const [visibility, setVisibility] =
    useState<ColumnVisibilityConfig>(defaultVisibility);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from cookies on mount
  useEffect(() => {
    const saved = Cookies.get(COOKIE_KEY_VISIBILITY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibility({ ...defaultVisibility, ...parsed });
      } catch {
        setVisibility(defaultVisibility);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to cookies when visibility changes
  const toggleColumn = useCallback(
    (column: keyof ColumnVisibilityConfig) => {
      setVisibility((prev) => {
        const next = { ...prev, [column]: !prev[column] };
        Cookies.set(COOKIE_KEY_VISIBILITY, JSON.stringify(next), {
          expires: 365,
        });
        return next;
      });
      // NOTE: onVisibilityChange is called via useEffect below
      // to avoid setState-during-render warning
    },
    []
  );

  // Notify parent when visibility changes
  useEffect(() => {
    if (isLoaded) {
      onVisibilityChange?.(visibility);
    }
  }, [isLoaded, visibility, onVisibilityChange]);

  // Load sidebar state from cookies
  useEffect(() => {
    const savedSidebar = Cookies.get(COOKIE_KEY_SIDEBAR);
    if (savedSidebar !== undefined) {
      const isOpen = savedSidebar === "true";
      // Only trigger toggle if state differs from initial
      if (isOpen !== isSidebarOpen && onSidebarToggle) {
        onSidebarToggle();
      }
    }
  }, []);

  // Save sidebar state to cookies
  const handleSidebarToggle = useCallback(() => {
    Cookies.set(COOKIE_KEY_SIDEBAR, String(!isSidebarOpen), { expires: 365 });
    onSidebarToggle?.();
  }, [isSidebarOpen, onSidebarToggle]);

  const visibleCount = Object.values(visibility).filter(Boolean).length;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2",
        "px-3 py-2.5",
        "rounded-card-xl shadow-card-lg",
        "border border-white/40",
        "transition-all duration-300",
        // Default: subtle/transparent
        "bg-white/40 backdrop-blur-sm opacity-40 scale-95",
        // Hover: visible/normal
        "hover:bg-white/95 hover:backdrop-blur-xl hover:opacity-100 hover:scale-100 hover:shadow-card-xl",
        // Entry animation
        isLoaded ? "translate-y-0" : "translate-y-4 opacity-0"
      )}
    >
      {/* Toggle Buttons */}
      <div className="flex items-center gap-1.5">
        {(
          Object.keys(COLUMN_LABELS) as Array<keyof ColumnVisibilityConfig>
        ).map((column) => {
          const isVisible = visibility[column];
          const isDisabled = visibleCount === 1 && isVisible;

          return (
            <button
              key={column}
              onClick={() => !isDisabled && toggleColumn(column)}
              disabled={isDisabled}
              className={cn(
                "group relative flex items-center gap-2",
                "px-3 py-1.5 rounded-card",
                "text-xs font-medium whitespace-nowrap",
                "transition-all duration-200",
                "border",
                // Visible state
                isVisible && [
                  "bg-slate-50 border-slate-200 text-slate-700",
                  "hover:bg-slate-100 hover:border-slate-300",
                  "shadow-sm",
                ],
                // Hidden state
                !isVisible && [
                  "bg-slate-100/50 border-slate-200/50 text-slate-400",
                  "hover:bg-slate-100 hover:border-slate-200",
                ],
                // Disabled state (can't hide last visible)
                isDisabled && [
                  "opacity-50 cursor-not-allowed",
                  "hover:bg-slate-50 hover:border-slate-200",
                ]
              )}
              title={
                isDisabled
                  ? "Debe haber al menos una columna visible"
                  : isVisible
                    ? `Ocultar ${COLUMN_LABELS[column]}`
                    : `Mostrar ${COLUMN_LABELS[column]}`
              }
            >
              {/* Status Dot */}
              <span
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  COLUMN_COLORS[column],
                  !isVisible && "opacity-30 grayscale"
                )}
              />

              {/* Label */}
              <span className={cn(!isVisible && "line-through opacity-60")}>
                {COLUMN_LABELS[column]}
              </span>

              {/* Icon */}
              <span className="ml-0.5">
                {isVisible ? (
                  <Eye className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-200/60 mx-1" />

      {/* Sidebar Toggle Button */}
      <button
        onClick={handleSidebarToggle}
        className={cn(
          "group relative flex items-center gap-2",
          "px-3 py-1.5 rounded-card",
          "text-xs font-medium whitespace-nowrap",
          "transition-all duration-200",
          "border",
          isSidebarOpen && [
            "bg-pink-50 border-pink-200 text-pink-700",
            "hover:bg-pink-100 hover:border-pink-300",
            "shadow-sm",
          ],
          !isSidebarOpen && [
            "bg-slate-100/50 border-slate-200/50 text-slate-400",
            "hover:bg-slate-100 hover:border-slate-200 hover:text-slate-600",
          ]
        )}
        title={
          isSidebarOpen
            ? "Ocultar panel de estadísticas"
            : "Mostrar panel de estadísticas"
        }
      >
        <span className={cn(!isSidebarOpen && "line-through opacity-60")}>
          Estadísticas
        </span>
        <span className="ml-0.5">
          {isSidebarOpen ? (
            <PanelRightClose className="w-3.5 h-3.5 text-pink-500 group-hover:text-pink-600 transition-colors" />
          ) : (
            <PanelRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          )}
        </span>
      </button>
    </div>
  );
}

// Hook to use column visibility
export function useColumnVisibility() {
  const [visibility, setVisibility] =
    useState<ColumnVisibilityConfig>(defaultVisibility);

  useEffect(() => {
    const saved = Cookies.get(COOKIE_KEY_VISIBILITY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibility({ ...defaultVisibility, ...parsed });
      } catch {
        setVisibility(defaultVisibility);
      }
    }
  }, []);

  return { visibility, setVisibility };
}
