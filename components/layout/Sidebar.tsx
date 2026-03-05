"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";

// Navigation items
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    name: "Pedidos",
    href: "/dashboard/orders",
    icon: ShoppingBagIcon,
  },
  {
    name: "Productos",
    href: "/products",
    icon: PackageIcon,
  },
  {
    name: "Clientes",
    href: "/customers",
    icon: UsersIcon,
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: SettingsIcon,
  },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onMenuClick?: () => void;
}

export function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onMenuClick,
}: SidebarProps) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full",
          "glass-strong border-r border-white/50",
          "transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          !isOpen && "-translate-x-full lg:hidden",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-icon bg-gradient-indigo-purple flex items-center justify-center shrink-0 shadow-card">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl text-slate-900">Togo</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-card text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-indigo-600" : "text-slate-400"
                  )}
                />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle collapse button (desktop only) */}
        <div className="absolute top-20 -right-3 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-full bg-white shadow-card border border-slate-100 text-slate-600 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 transition-all"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <ChevronIcon
              className={cn(
                "w-3 h-3 transition-transform duration-300",
                isCollapsed ? "rotate-180" : ""
              )}
            />
          </button>
        </div>

        {/* Bottom section - User with notifications */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 border-t border-slate-100/50",
            isCollapsed ? "p-2" : "p-4"
          )}
        >
          {/* User section with notifications */}
          <div
            className={cn(
              "flex items-center rounded-card bg-slate-50/80",
              isCollapsed ? "justify-center p-2" : "gap-3 px-4 py-3"
            )}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-indigo-purple flex items-center justify-center shrink-0">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>

            {/* User info */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || "Usuario"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            )}

            {/* Notifications - right side */}
            <button
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-full transition-colors shrink-0"
              title="Notificaciones"
            >
              <BellIcon className={cn("w-5 h-5", isCollapsed && "w-4 h-4")} />
              {/* Notification badge with count */}
              <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-xxs font-bold px-1 rounded-full ring-2 ring-slate-50/80">
                3
              </span>
            </button>
          </div>

          {!isCollapsed && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-slate-500 hover:text-red-600"
              onClick={() => logout.mutate()}
              isLoading={logout.isPending}
            >
              <LogoutIcon className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

// Icons
function LayoutDashboardIcon({ className }: { className?: string }) {
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
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
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
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
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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

function LogoutIcon({ className }: { className?: string }) {
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
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
