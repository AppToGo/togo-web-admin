"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
}

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Pedidos",
  "/products": "Productos",
  "/customers": "Clientes",
  "/settings": "Configuración",
};

export function Header({
  onMenuClick,
  isSidebarOpen,
  isSidebarCollapsed,
}: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Togo";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16",
        "glass border-b border-white/50",
        "transition-all duration-300",
        "left-0 lg:left-64",
        isSidebarCollapsed && "lg:left-20"
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          >
            <MenuIcon className="w-5 h-5" />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hidden lg:flex text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpenIcon className="w-5 h-5" />
            ) : (
              <PanelLeftCloseIcon className="w-5 h-5" />
            )}
          </Button>

          {/* Search */}
          <div className="hidden md:flex items-center bg-slate-100/80 rounded-card px-4 py-2">
            <SearchIcon className="w-4 h-4 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search everything"
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-48"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 mr-4">
            <a href="#" className="text-sm font-medium text-indigo-600">
              Projects
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Settings
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Help
            </a>
          </nav>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// Icons
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

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
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
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function PanelLeftCloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  );
}

function PanelRightOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M15 3v18" />
      <path d="m8 9 3 3-3 3" />
    </svg>
  );
}
