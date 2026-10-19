"use client";

/**
 * Índice de secciones fijo (sticky) para páginas de configuración largas:
 * salta a cada sección y marca la que se está viendo mientras se hace
 * scroll. Las secciones son elementos con `id` y `scroll-mt-*`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionNavItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  label: string;
  title?: string;
  items: SectionNavItem[];
  className?: string;
}

/** Una sección cuenta como "actual" cuando su borde superior pasa esta línea. */
const ACTIVE_LINE_PX = 140;
/** Tras un clic, el scroll suave no cambia la sección marcada durante este tiempo. */
const CLICK_LOCK_MS = 900;

export function SectionNav({ label, title, items, className }: SectionNavProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const lockUntil = useRef(0);
  // Las ids como dependencia: el padre suele pasar un arreglo nuevo en cada
  // render y no queremos volver a suscribir los listeners por eso.
  const ids = items.map((item) => item.id).join("|");

  const update = useCallback(() => {
    if (Date.now() < lockUntil.current) return;
    const list = ids ? ids.split("|") : [];
    let current = list[0] ?? "";
    for (const id of list) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= ACTIVE_LINE_PX) current = id;
    }
    // Al final de la página la última sección puede no llegar a la línea.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom && list.length > 0) current = list[list.length - 1];
    setActive(current);
  }, [ids]);

  useEffect(() => {
    // Primera medición cuando el contenido ya está pintado.
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return (
    <nav
      aria-label={label}
      className={cn(
        "sticky top-6 flex flex-col gap-0.5 self-start rounded-[20px] border border-white/90 bg-white/70 p-2",
        className
      )}
    >
      {title && (
        <span className="px-3 pb-2 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
      )}
      {items.map((item) => {
        const on = item.id === active;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={on ? "location" : undefined}
            onClick={(event) => {
              const el = document.getElementById(item.id);
              if (!el) return;
              event.preventDefault();
              lockUntil.current = Date.now() + CLICK_LOCK_MS;
              el.scrollIntoView({ behavior: "smooth", block: "start" });
              setActive(item.id);
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
              on
                ? "bg-white font-semibold text-indigo-600"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            )}
          >
            <span
              aria-hidden
              className={cn("h-4 w-[3px] shrink-0 rounded-full", on ? "bg-indigo-600" : "bg-transparent")}
            />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
