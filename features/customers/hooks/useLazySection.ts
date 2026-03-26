"use client";

import { useRef, useEffect, useCallback } from "react";
import { useIntersectionObserver } from "./useIntersectionObserver";

const getStorageKey = (customerId: string, sectionId: string) => 
  `customer_${customerId}_section_${sectionId}`;

interface UseLazySectionReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  shouldLoad: boolean;
  isVisible: boolean;
}

export function useLazySection(customerId: string, sectionId: string): UseLazySectionReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  
  // Check sessionStorage on mount
  const wasPreviouslyLoaded = typeof window !== "undefined" 
    ? sessionStorage.getItem(getStorageKey(customerId, sectionId)) === "true"
    : false;

  const { isIntersecting, hasIntersected } = useIntersectionObserver(ref, {
    threshold: 0.1,
    rootMargin: "100px",
    triggerOnce: true,
  });

  // Persist loaded state to sessionStorage
  useEffect(() => {
    if (hasIntersected && typeof window !== "undefined") {
      sessionStorage.setItem(getStorageKey(customerId, sectionId), "true");
    }
  }, [hasIntersected, customerId, sectionId]);

  // shouldLoad is true if previously loaded or currently intersecting
  const shouldLoad = wasPreviouslyLoaded || hasIntersected;
  const isVisible = isIntersecting;

  return { ref, shouldLoad, isVisible };
}
