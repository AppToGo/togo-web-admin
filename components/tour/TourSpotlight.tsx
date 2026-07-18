"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { TourPopover } from "./TourPopover";
import type { TourStep } from "./tour.types";

interface TourSpotlightProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_BORDER_RADIUS = 10;

export function TourSpotlight({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourSpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const elementRef = useRef<Element | null>(null);
  const skippedRef = useRef(false);

  // Resolve translations using the full key paths stored on the step
  const tFull = useTranslations();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const title = tFull(step.titleKey as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const description = tFull(step.descriptionKey as any);

  const updateRect = useCallback(() => {
    if (!elementRef.current) return;
    setRect(elementRef.current.getBoundingClientRect());
  }, []);

  // RAF ref for debounced updates
  const rafRef = useRef<number | null>(null);

  const debouncedUpdateRect = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateRect();
      rafRef.current = null;
    });
  }, [updateRect]);

  // Reset skipped flag when step changes (not on every render)
  useEffect(() => {
    skippedRef.current = false;
  }, [step.id]);

  // Main effect: find element and update rect
  useEffect(() => {
    const target = document.querySelector(`[data-tour-step="${step.id}"]`) as HTMLElement | null;

    if (!target) {
      // Element not found — skip this step automatically after a small delay
      // to allow lazy-loaded elements to mount
      if (!skippedRef.current) {
        skippedRef.current = true;
        const timer = setTimeout(onNext, 300);
        return () => clearTimeout(timer);
      }
      return;
    }

    elementRef.current = target;
    setRect(target.getBoundingClientRect());

    // Scroll element into view
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });

    // Observe size changes
    observerRef.current = new ResizeObserver(debouncedUpdateRect);
    observerRef.current.observe(target);

    // Update rect on scroll / resize
    window.addEventListener("scroll", debouncedUpdateRect, { passive: true });
    window.addEventListener("resize", debouncedUpdateRect, { passive: true });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", debouncedUpdateRect);
      window.removeEventListener("resize", debouncedUpdateRect);
      elementRef.current = null;
    };
  }, [step.id, onNext, debouncedUpdateRect]);

  if (typeof window === "undefined") return null;
  if (!rect) return null;

  const spotLeft = rect.left - SPOTLIGHT_PADDING;
  const spotTop = rect.top - SPOTLIGHT_PADDING;
  const spotWidth = rect.width + SPOTLIGHT_PADDING * 2;
  const spotHeight = rect.height + SPOTLIGHT_PADDING * 2;

  return createPortal(
    <>
      {/* Full-screen overlay — blocks all pointer events on background content */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          pointerEvents: 'all',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Animated spotlight highlight with box-shadow overlay */}
      <motion.div
        animate={{
          top: spotTop,
          left: spotLeft,
          width: spotWidth,
          height: spotHeight,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          position: 'fixed',
          zIndex: 201,
          borderRadius: SPOTLIGHT_BORDER_RADIUS,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          pointerEvents: 'none',
          outline: '2px solid rgba(99,102,241,0.7)',
          outlineOffset: '2px',
        }}
      />

      {/* Popover renders above the overlay so it receives pointer events */}
      <TourPopover
        step={step}
        title={title}
        description={description}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        anchorRect={rect}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
      />
    </>,
    document.body
  );
}
