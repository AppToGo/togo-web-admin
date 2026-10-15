"use client";

/**
 * Barra inferior de una sección en el teléfono (Conversaciones, Catálogo):
 * salta entre sus pantallas hermanas. Con una sola entrada visible no se
 * muestra.
 */

import type { LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { HIDDEN_FROM, type HiddenFrom } from "./hidden-from";
import { cn } from "@/lib/utils";


export interface MobileBottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  show?: boolean;
}

interface MobileBottomNavProps {
  label: string;
  items: MobileBottomNavItem[];
  hiddenFrom: HiddenFrom;
  testId?: string;
}

export function MobileBottomNav({ label, items, hiddenFrom, testId }: MobileBottomNavProps) {
  const pathname = usePathname();
  const visible = items.filter((item) => item.show !== false);
  if (visible.length < 2) return null;

  return (
    <>
      {/* Reserva el alto de la barra al final del contenido. */}
      <div aria-hidden className={cn("h-20", HIDDEN_FROM[hiddenFrom])} />
      <nav
        aria-label={label}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl",
          HIDDEN_FROM[hiddenFrom]
        )}
        data-testid={testId}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
        >
          {visible.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "font-semibold text-indigo-700" : "font-medium text-slate-500"
                )}
              >
                <Icon className="h-[22px] w-[22px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
