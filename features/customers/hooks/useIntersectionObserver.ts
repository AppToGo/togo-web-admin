"use client";

import { useEffect, useState, useRef, RefObject } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  hasIntersected: boolean;
}

export function useIntersectionObserver(
  ref: RefObject<HTMLElement | null>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  // Use ref to track hasIntersected for triggerOnce mode to avoid re-renders
  const hasIntersectedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Si ya intersectó y triggerOnce es true, no observar de nuevo
    if (triggerOnce && hasIntersectedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting) {
          hasIntersectedRef.current = true;
          setHasIntersected(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
    // Nota: No incluimos hasIntersected ni hasIntersectedRef en las dependencias
    // para evitar re-conexiones innecesarias cuando triggerOnce=true
  }, [ref, threshold, rootMargin, triggerOnce]);

  return { isIntersecting, hasIntersected };
}
