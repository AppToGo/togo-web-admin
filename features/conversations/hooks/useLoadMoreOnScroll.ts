"use client";

import { useEffect, useState, type RefObject } from "react";

/** Anticipación con la que se pide la página siguiente antes de llegar al final. */
const LOAD_MORE_ROOT_MARGIN = "200px";

interface UseLoadMoreOnScrollOptions {
  hasNextPage: boolean;
  /**
   * Cualquier fetch de la query en curso (página siguiente o refetch de
   * todas). No se observa mientras tanto: `fetchNextPage` cancela por
   * defecto un refetch en curso y se perderían los datos nuevos.
   */
  isFetching: boolean;
  /** Falló la página siguiente (`isFetchNextPageError`). */
  hasError: boolean;
  onLoadMore: () => void;
  /** Contenedor que scrollea; sin él se usa el viewport (lista que scrollea con la página). */
  rootRef?: RefObject<HTMLElement | null>;
  /** Cambia al llegar datos: re-observa por si el sentinel sigue visible. */
  itemCount: number;
}

/**
 * Scroll infinito de las listas del inbox (escritorio y teléfono): devuelve
 * un callback ref para un sentinel al final de la lista; cuando entra en la
 * zona visible se pide la página siguiente. Se re-observa al cambiar la
 * cantidad de items: si la página recién cargada no llena el alto, el
 * sentinel sigue visible y pide otra.
 *
 * Si falla la página siguiente queda "trabado" hasta que el usuario toque
 * Reintentar (`retry`) o cambien los datos (otro filtro, una conversación
 * nueva). `isFetchNextPageError` solo no alcanza: TanStack lo apaga apenas
 * empieza cualquier refetch (socket, intervalo sin socket), y con el
 * sentinel a la vista se volvería a pedir la página rota en cada uno.
 */
export function useLoadMoreOnScroll({
  hasNextPage,
  isFetching,
  hasError,
  onLoadMore,
  rootRef,
  itemCount,
}: UseLoadMoreOnScrollOptions) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [prevItemCount, setPrevItemCount] = useState(itemCount);

  // Ajuste de estado durante el render (no un useEffect).
  if (hasError && !isStuck) setIsStuck(true);
  if (itemCount !== prevItemCount) {
    setPrevItemCount(itemCount);
    if (isStuck && !hasError) setIsStuck(false);
  }

  useEffect(() => {
    if (!sentinel || !hasNextPage || isFetching || isStuck) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: rootRef?.current ?? null, rootMargin: LOAD_MORE_ROOT_MARGIN }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasNextPage, isFetching, isStuck, onLoadMore, rootRef, itemCount]);

  const retry = () => {
    setIsStuck(false);
    onLoadMore();
  };

  return { sentinelRef: setSentinel, isStuck, retry };
}
