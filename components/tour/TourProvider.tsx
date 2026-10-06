"use client";

import { createContext, useContext } from "react";
import { useTour } from "@/hooks/useTour";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TourSpotlight } from "./TourSpotlight";
import type { TourContextValue, TourStep } from "./tour.types";

const TourContext = createContext<TourContextValue | null>(null);

interface TourProviderProps {
  tourId: string;
  steps: TourStep[];
  children: React.ReactNode;
  readyToStart?: boolean;
}

export function TourProvider({ tourId, steps, children, readyToStart = true }: TourProviderProps) {
  const value = useTour(tourId, steps, readyToStart);
  // The tour is desktop-only: on mobile it never auto-starts (see useTour)
  // and the spotlight isn't rendered.
  const isMobile = useIsMobile();

  return (
    <TourContext.Provider value={value}>
      {children}
      {!isMobile && value.isActive && value.currentStep && (
        <TourSpotlight
          step={value.currentStep}
          currentIndex={value.currentStepIndex}
          totalSteps={value.totalSteps}
          onNext={value.goNext}
          onPrev={value.goPrev}
          onSkip={value.skip}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTourContext must be used inside a TourProvider");
  }
  return ctx;
}
