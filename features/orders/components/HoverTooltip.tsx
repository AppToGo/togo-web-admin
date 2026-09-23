"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Side = "top" | "bottom" | "left" | "right";

// The native `title` tooltip takes ~1s to show (browser-controlled, not
// configurable); this one shows almost instantly.
const SHOW_DELAY_MS = 120;
const OFFSET_PX = 6;

const TRANSFORM_BY_SIDE: Record<Side, string> = {
  top: "translate(-50%, -100%)",
  bottom: "translate(-50%, 0)",
  left: "translate(-100%, -50%)",
  right: "translate(0, -50%)",
};

interface HoverTooltipProps {
  content: string;
  side?: Side;
  children: ReactNode;
}

/**
 * Lightweight tooltip for the Orders screen controls. Rendered in a portal
 * with `position: fixed`, so `overflow-hidden` containers (stats rail, board
 * columns) don't clip it. The wrapper uses `display: contents` and creates
 * no box, so it doesn't affect the flex/grid layout of the wrapped control.
 */
export function HoverTooltip({ content, side = "top", children }: HoverTooltipProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const show = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // The wrapper has no box (display: contents), so measure its child.
      const el = wrapperRef.current?.firstElementChild;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPosition(
        side === "top"
          ? { x: r.left + r.width / 2, y: r.top - OFFSET_PX }
          : side === "bottom"
            ? { x: r.left + r.width / 2, y: r.bottom + OFFSET_PX }
            : side === "left"
              ? { x: r.left - OFFSET_PX, y: r.top + r.height / 2 }
              : { x: r.right + OFFSET_PX, y: r.top + r.height / 2 }
      );
    }, SHOW_DELAY_MS);
  }, [side]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setPosition(null);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <>
      <span
        ref={wrapperRef}
        className="contents"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        // Hide on click (e.g. so it doesn't cover a menu that opens).
        onPointerDown={hide}
      >
        {children}
      </span>
      {position &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[10000] pointer-events-none px-2 py-1 rounded-md bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap shadow-card-md animate-fadeIn"
            style={{ left: position.x, top: position.y, transform: TRANSFORM_BY_SIDE[side] }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
