"use client";

import { useEffect, useState, type RefObject } from "react";

/** Anticipación con la que se pide la página siguiente antes de llegar al final. */
const LOAD_MORE_ROOT_MARGIN = "200px";

interface UseLoadMoreOnScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  /** Contenedor que scrollea; sin él se usa el viewport (lista que scrollea con la página). */
  rootRef?: RefObject<HTMLElement | null>;
  /** Cambia al llegar una página: re-observa por si el sentinel sigue visible. */
  itemCount: number;
}

/**
 * Scroll infinito de las listas del inbox (escritorio y teléfono): devuelve
 * un callback ref para un sentinel al final de la lista; cuando entra en la
 * zona visible se pide la página siguiente. Se re-observa al cambiar la
 * cantidad de items: si la página recién cargada no llena el alto, el
 * sentinel sigue visible y pide otra.
 */
export function useLoadMoreOnScroll({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  rootRef,
  itemCount,
}: UseLoadMoreOnScrollOptions) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: rootRef?.current ?? null, rootMargin: LOAD_MORE_ROOT_MARGIN }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasNextPage, isFetchingNextPage, onLoadMore, rootRef, itemCount]);

  return setSentinel;
}
