"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Pedidos",
  "/products": "Productos",
  "/customers": "Clientes",
  "/settings": "Configuración",
};

export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Togo";

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white border-b border-slate-100 transition-all duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <MenuIcon className="w-5 h-5" />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hidden lg:flex"
          >
            <MenuIcon
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                !isSidebarOpen && "rotate-180"
              )}
            />
          </Button>

          {/* Page title */}
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <SearchIcon className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none w-48"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
