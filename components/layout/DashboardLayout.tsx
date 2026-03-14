"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Sidebar izquierdo (menú) */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile menu button - shown when sidebar is closed */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-30 lg:hidden",
          "w-10 h-10 rounded-card glass",
          "flex items-center justify-center",
          "text-slate-600 hover:text-slate-900",
          "transition-all duration-300",
          sidebarOpen && "opacity-0 pointer-events-none"
        )}
        aria-label="Abrir menú"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Main content area */}
      <div
        className={cn(
          "min-h-screen flex flex-col",
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        {/* Page content */}
        <main className="flex-1 flex flex-col p-4 sm:p-6">
          <div className="flex-1 flex flex-col max-w-screen-2xl w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
