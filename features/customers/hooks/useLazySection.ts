"use client";

import { useRef, useEffect, useCallback } from "react";
import { useIntersectionObserver } from "./useIntersectionObserver";

const getStorageKey = (sectionId: string) => `customer_section_loaded_${sectionId}`;

interface UseLazySectionReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  shouldLoad: boolean;
  isVisible: boolean;
}

export function useLazySection(sectionId: string): UseLazySectionReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  
  // Check sessionStorage on mount
  const wasPreviouslyLoaded = typeof window !== "undefined" 
    ? sessionStorage.getItem(getStorageKey(sectionId)) === "true"
    : false;

  const { isIntersecting, hasIntersected } = useIntersectionObserver(ref as React.RefObject<Element>, {
    threshold: 0.1,
    rootMargin: "100px",
    triggerOnce: true,
  });

  // Persist loaded state to sessionStorage
  useEffect(() => {
    if (hasIntersected && typeof window !== "undefined") {
      sessionStorage.setItem(getStorageKey(sectionId), "true");
    }
  }, [hasIntersected, sectionId]);

  // shouldLoad is true if previously loaded or currently intersecting
  const shouldLoad = wasPreviouslyLoaded || hasIntersected;
  const isVisible = isIntersecting;

  return { ref, shouldLoad, isVisible };
}
