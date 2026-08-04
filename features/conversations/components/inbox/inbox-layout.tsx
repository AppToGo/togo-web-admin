"use client";

import type { ReactNode } from "react";

interface InboxLayoutProps {
  list: ReactNode;
  panel: ReactNode;
}

export function InboxLayout({ list, panel }: InboxLayoutProps) {
  return (
    <div className="flex flex-row flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <aside className="w-80 shrink-0 border-r border-slate-200 overflow-hidden">
        {list}
      </aside>
      <div className="flex-1 min-w-0 overflow-hidden">{panel}</div>
    </div>
  );
}
