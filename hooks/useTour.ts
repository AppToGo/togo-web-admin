"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useTourStore } from "@/stores/tour.store";
import type { TourContextValue, TourStep } from "@/components/tour/tour.types";

const TOUR_START_DELAY_MS = 600;

export function useTour(tourId: string, steps: TourStep[], readyToStart = true): TourContextValue {
  const user = useAuthStore((state) => state.user);
  const { markCompleted, isTourCompleted, setTourRunning } = useTourStore();

  const userId = user?.userId ?? "anonymous";
  const businessId = user?.businessId ?? "none";
  const tourKey = `${tourId}:${userId}:${businessId}`;

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydration guard: wait for the client to hydrate before checking tour state
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Auto-start the tour after delay if it hasn't been completed
  useEffect(() => {
    if (!hydrated) return; // Wait for hydration — avoids SSR key mismatch
    if (!readyToStart) return; // Wait until caller signals data is ready
    if (typeof window === "undefined") return;

    const alreadyDone = isTourCompleted(tourKey);
    if (alreadyDone) return;

    // Signal immediately (before the visual delay) so other effects that depend
    // on isTourRunning (e.g. upgrade modal) see it synchronously on the same flush.
    setTourRunning(true);

    timerRef.current = setTimeout(() => {
      setIsActive(true);
      setCurrentStepIndex(0);
    }, TOUR_START_DELAY_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        // Component unmounted before tour started — clear the running flag
        setTourRunning(false);
      }
    };
    // Only run once on mount — tourKey changes only when user/business changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourKey, readyToStart, hydrated]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setTourRunning(true);
    setIsActive(true);
  }, [setTourRunning]);

  const goNext = useCallback(() => {
    const next = currentStepIndex + 1;
    if (next >= steps.length) {
      // Tour finished — mark completed and signal end before deactivating
      setCurrentStepIndex(0);
      markCompleted(tourKey);
      setTourRunning(false);
      setIsActive(false);
    } else {
      setCurrentStepIndex(next);
    }
  }, [currentStepIndex, steps.length, tourKey, markCompleted, setTourRunning]);

  const goPrev = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    markCompleted(tourKey);
    setTourRunning(false);
    setCurrentStepIndex(0);
  }, [tourKey, markCompleted, setTourRunning]);

  const currentStep = isActive && steps.length > 0 ? (steps[currentStepIndex] ?? null) : null;

  return {
    isActive,
    currentStepIndex,
    totalSteps: steps.length,
    currentStep,
    startTour,
    goNext,
    goPrev,
    skip,
  };
}
