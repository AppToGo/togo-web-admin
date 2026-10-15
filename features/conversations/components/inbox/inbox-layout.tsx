"use client";

import type { ReactNode } from "react";

interface InboxLayoutProps {
  list: ReactNode;
  /** Hilo (y panel del cliente) o el estado vacío: cada uno trae su tarjeta. */
  panel: ReactNode;
}

/** Columnas glass del Inbox de escritorio: lista · hilo · datos del cliente. */
export function InboxLayout({ list, panel }: InboxLayoutProps) {
  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-card-xl border border-white/80 bg-white/45 backdrop-blur-xl">
        {list}
      </aside>
      <div className="flex min-w-0 flex-1 gap-4">{panel}</div>
    </div>
  );
}
