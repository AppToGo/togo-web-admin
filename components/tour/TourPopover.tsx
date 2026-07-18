"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { TourStep } from "./tour.types";

interface TourPopoverProps {
  step: TourStep;
  title: string;
  description: string;
  currentIndex: number;
  totalSteps: number;
  anchorRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface PopoverPosition {
  top: number;
  left: number;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
  arrowOffset: number;
}

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT_ESTIMATE = 200;
const POPOVER_MARGIN = 12;
const ARROW_SIZE = 8;

function computePosition(
  rect: DOMRect,
  preferredSide: TourStep['preferredSide'],
  vpWidth: number,
  vpHeight: number
): PopoverPosition {
  const side = preferredSide ?? 'bottom';

  // Clamp left/top so the popover stays inside the viewport
  const clampH = (x: number) => Math.max(8, Math.min(x, vpWidth - POPOVER_WIDTH - 8));
  const clampV = (y: number) => Math.max(8, Math.min(y, vpHeight - POPOVER_HEIGHT_ESTIMATE - 8));

  const centeredLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
  const centeredTop = rect.top + rect.height / 2 - POPOVER_HEIGHT_ESTIMATE / 2;

  // Arrow offset: distance from the popover left/top edge to the arrow tip center
  function horizontalArrow(left: number): number {
    return rect.left + rect.width / 2 - left - ARROW_SIZE;
  }
  function verticalArrow(top: number): number {
    return rect.top + rect.height / 2 - top - ARROW_SIZE;
  }

  const fits = {
    bottom: rect.bottom + POPOVER_MARGIN + POPOVER_HEIGHT_ESTIMATE <= vpHeight,
    top: rect.top - POPOVER_MARGIN - POPOVER_HEIGHT_ESTIMATE >= 0,
    right: rect.right + POPOVER_MARGIN + POPOVER_WIDTH <= vpWidth,
    left: rect.left - POPOVER_MARGIN - POPOVER_WIDTH >= 0,
  };

  // Try preferred side first, then fall back in order
  const order: Array<'bottom' | 'top' | 'right' | 'left'> = [
    side as 'bottom' | 'top' | 'right' | 'left',
    'bottom',
    'top',
    'right',
    'left',
  ];

  for (const s of order) {
    if (!fits[s]) continue;
    if (s === 'bottom') {
      const left = clampH(centeredLeft);
      return { top: rect.bottom + POPOVER_MARGIN, left, arrowSide: 'top', arrowOffset: horizontalArrow(left) };
    }
    if (s === 'top') {
      const left = clampH(centeredLeft);
      return { top: rect.top - POPOVER_MARGIN - POPOVER_HEIGHT_ESTIMATE, left, arrowSide: 'bottom', arrowOffset: horizontalArrow(left) };
    }
    if (s === 'right') {
      const top = clampV(centeredTop);
      return { top, left: rect.right + POPOVER_MARGIN, arrowSide: 'left', arrowOffset: verticalArrow(top) };
    }
    if (s === 'left') {
      const top = clampV(centeredTop);
      return { top, left: rect.left - POPOVER_MARGIN - POPOVER_WIDTH, arrowSide: 'right', arrowOffset: verticalArrow(top) };
    }
  }

  // Fallback: center of viewport
  const left = clampH(centeredLeft);
  const top = clampV(centeredTop);
  return { top, left, arrowSide: 'top', arrowOffset: horizontalArrow(left) };
}

export function TourPopover({
  step,
  title,
  description,
  currentIndex,
  totalSteps,
  anchorRect,
  onNext,
  onPrev,
  onSkip,
}: TourPopoverProps) {
  const t = useTranslations("common.tour");

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSteps - 1;

  const [vpWidth, setVpWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [vpHeight, setVpHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setVpWidth(window.innerWidth);
      setVpHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const position = anchorRect
    ? computePosition(anchorRect, step.preferredSide, vpWidth, vpHeight)
    : {
        top: vpHeight / 2 - POPOVER_HEIGHT_ESTIMATE / 2,
        left: vpWidth / 2 - POPOVER_WIDTH / 2,
        arrowSide: 'top' as const,
        arrowOffset: POPOVER_WIDTH / 2 - ARROW_SIZE,
      };

  const arrowBase: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    pointerEvents: 'none',
  };

  const arrowStyles: Record<string, React.CSSProperties> = {
    top: {
      ...arrowBase,
      top: -ARROW_SIZE,
      left: Math.max(ARROW_SIZE, position.arrowOffset),
      borderLeft: `${ARROW_SIZE}px solid transparent`,
      borderRight: `${ARROW_SIZE}px solid transparent`,
      borderBottom: `${ARROW_SIZE}px solid white`,
    },
    bottom: {
      ...arrowBase,
      bottom: -ARROW_SIZE,
      left: Math.max(ARROW_SIZE, position.arrowOffset),
      borderLeft: `${ARROW_SIZE}px solid transparent`,
      borderRight: `${ARROW_SIZE}px solid transparent`,
      borderTop: `${ARROW_SIZE}px solid white`,
    },
    left: {
      ...arrowBase,
      left: -ARROW_SIZE,
      top: Math.max(ARROW_SIZE, position.arrowOffset),
      borderTop: `${ARROW_SIZE}px solid transparent`,
      borderBottom: `${ARROW_SIZE}px solid transparent`,
      borderRight: `${ARROW_SIZE}px solid white`,
    },
    right: {
      ...arrowBase,
      right: -ARROW_SIZE,
      top: Math.max(ARROW_SIZE, position.arrowOffset),
      borderTop: `${ARROW_SIZE}px solid transparent`,
      borderBottom: `${ARROW_SIZE}px solid transparent`,
      borderLeft: `${ARROW_SIZE}px solid white`,
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: POPOVER_WIDTH,
          zIndex: 210,
        }}
        className="bg-white rounded-xl shadow-2xl border border-slate-100 p-5 pointer-events-auto"
      >
        {/* Positioning arrow */}
        <div style={arrowStyles[position.arrowSide]} />

        {/* Step indicator + skip link */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {t("stepIndicator", { current: currentIndex + 1, total: totalSteps })}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t("skip")}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 text-sm mb-1.5 leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-xs leading-relaxed mb-4">
          {description}
        </p>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t("prev")}
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors"
          >
            {isLast ? t("finish") : t("next")}
            {!isLast && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
