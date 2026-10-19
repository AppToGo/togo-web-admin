import { useLayoutEffect, useRef } from "react";

/**
 * Alto disponible desde donde empieza el elemento hasta el borde inferior
 * de la ventana (menos `bottomOffset`), expuesto como `--fill-height`.
 *
 * Reemplaza a un `calc(100dvh - Xrem)` fijo: lo que hay arriba (título de la
 * página con la caja, acciones, selector de sede, banner de prueba) cambia
 * de alto al envolverse, y con un valor fijo el pie de la venta quedaba
 * fuera de la pantalla. Se escribe directo en el estilo (sin estado de
 * React) para no re-renderizar en cada medición.
 */
export function useFillViewport<T extends HTMLElement>(bottomOffset: number) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.setProperty(
        "--fill-height",
        `${Math.max(0, window.innerHeight - top - bottomOffset)}px`
      );
    };

    measure();
    // Cambios de lo que hay arriba (envolverse, banner) mueven el body; el
    // propio elemento cambia al volver a mostrarse (oculto fuera de Vender).
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [bottomOffset]);

  return ref;
}
