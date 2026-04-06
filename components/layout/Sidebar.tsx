"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { locales } from "@/i18n/config";
import { cn } from "@/lib/utils";
import {
  useCurrentUser,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BusinessSelector } from "@/features/business/components/BusinessSelector";
import { LanguageSwitcherButtons } from "@/components/LanguageSwitcher";
import { useBranchMode } from "@/features/branches/hooks/useBranchMode";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onMenuClick?: () => void;
}

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
};

export function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onMenuClick,
}: SidebarProps) {
  const t = useTranslations("navigation");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const user = useCurrentUser();
  const isSuperAdmin = useIsSuperAdmin();
  const logout = useLogout();
  const branchMode = useBranchMode();

  // Navigation items with translation keys
  const navigation: NavigationItem[] = React.useMemo(() => {
    const items: NavigationItem[] = [
      {
        name: t("sidebar.dashboard"),
        href: "/dashboard",
        icon: LayoutDashboardIcon,
      },
      {
        name: t("sidebar.orders"),
        href: "/dashboard/orders",
        icon: ShoppingBagIcon,
      },
      {
        name: t("sidebar.catalog"),
        href: "/dashboard/catalog",
        icon: PackageIcon,
        children: [
          {
            name: t("sidebar.myProducts"),
            href: "/dashboard/catalog/products",
            icon: BoxIcon,
          },
          {
            name: t("sidebar.inventory"),
            href: "/dashboard/inventory",
            icon: InventoryIcon,
          },
          {
            name: t("sidebar.globalCatalog"),
            href: "/dashboard/catalog/global",
            icon: GlobeIcon,
          },
          {
            name: t("sidebar.categories"),
            href: "/dashboard/catalog/categories",
            icon: TagsIcon,
          },
        ],
      },
      {
        name: t("sidebar.customers"),
        href: "/dashboard/customers",
        icon: UsersIcon,
      },
      {
        name: t("sidebar.settings"),
        href: "/dashboard/settings",
        icon: SettingsIcon,
        children: [
          // Modo SINGLE (1 sede): Mostrar Configuración General
          // Modo MULTI (2+ sedes): Mostrar Sedes
          ...(branchMode?.mode === 'SINGLE'
            ? [
                {
                  name: t("sidebar.general"),
                  href: "/dashboard/settings/general",
                  icon: UserIcon,
                },
              ]
            : [
                {
                  name: t("sidebar.branches"),
                  href: "/dashboard/branches",
                  icon: BuildingIcon,
                },
              ]),
          {
            name: t("sidebar.operatorProfiles"),
            href: "/dashboard/settings/operator-profiles",
            icon: ShieldIcon,
          },
          {
            name: t("sidebar.users"),
            href: "/dashboard/settings/users",
            icon: UsersIcon,
          },
        ],
      },
    ];

    return items;
  }, [t, branchMode]);

  // Admin navigation (Super Admin only)
  const adminNavigation: NavigationItem[] = [
    {
      name: t("sidebar.globalCatalog"),
      href: "/admin/global-products",
      icon: GlobeIcon,
    },
    {
      name: t("sidebar.industryCategories"),
      href: "/admin/industry-categories",
      icon: TagsIcon,
    },
  ];

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

        {/* Business Selector (solo SUPER_ADMIN) */}
        {!isCollapsed && <BusinessSelector />}

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => (
            <CollapsibleNavItem
              key={item.name}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
              onMenuClick={onMenuClick}
            />
          ))}
        </nav>

        {/* Admin Navigation (Super Admin only) */}
        {isSuperAdmin && (
          <>
            {!isCollapsed && (
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t("sidebar.administration")}
                </p>
              </div>
            )}
            <nav className="px-3 pb-3 space-y-1">
              {adminNavigation.map((item) => (
                <CollapsibleNavItem
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  isAdmin
                  onMenuClick={onMenuClick}
                />
              ))}
            </nav>
          </>
        )}

        {/* Toggle collapse button (desktop only) */}
        <div className="absolute top-20 -right-3 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-full bg-white shadow-card border border-slate-100 text-slate-600 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 transition-all"
            title={
              isCollapsed
                ? tc("buttons.expandMenu")
                : tc("buttons.collapseMenu")
            }
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
          {/* Language Switcher */}
          {!isCollapsed && (
            <div className="mb-3 flex justify-center">
              <LanguageSwitcherButtons />
            </div>
          )}

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
                  {user?.name || t("sidebar.user")}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            )}

            {/* Notifications - right side */}
            <button
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-full transition-colors shrink-0"
              title={t("sidebar.notifications")}
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
              {t("sidebar.logout")}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

// Helper to remove locale prefix and trailing slashes for comparison
function normalizePath(path: string): string {
  const localeList = locales as unknown as string[];
  const parts = path.split("/");
  let normalized;

  // Remove locale
  if (parts[1] && localeList.includes(parts[1])) {
    normalized = "/" + parts.slice(2).join("/") || "/";
  } else {
    normalized = path;
  }

  // Remove trailing slash (except for root)
  if (normalized.endsWith("/") && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

// Collapsible Navigation Item Component
interface CollapsibleNavItemProps {
  item: NavigationItem;
  pathname: string;
  isCollapsed: boolean;
  isAdmin?: boolean;
  onMenuClick?: () => void;
}

function CollapsibleNavItem({
  item,
  pathname,
  isCollapsed,
  isAdmin,
  onMenuClick,
}: CollapsibleNavItemProps) {
  const normalizedPathname = normalizePath(pathname);

  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if a child is active
    if (item.children) {
      return item.children.some((child) =>
        normalizedPathname.startsWith(normalizePath(child.href))
      );
    }
    return false;
  });

  const hasChildren = item.children && item.children.length > 0;

  // Determine active states
  const normalizedItemHref = normalizePath(item.href);
  const isParentActive =
    normalizedPathname === normalizedItemHref ||
    normalizedPathname.startsWith(`${normalizedItemHref}/`);
  const isAnyChildActive = hasChildren
    ? item.children!.some(
        (child) => normalizedPathname === normalizePath(child.href)
      )
    : false;

  // If no children, render as simple Link
  if (!hasChildren) {
    const isActive =
      normalizedItemHref === "/dashboard"
        ? normalizedPathname === "/dashboard"
        : normalizedPathname === normalizedItemHref ||
          normalizedPathname.startsWith(`${normalizedItemHref}/`);
    return (
      <Link
        href={item.href}
        onClick={onMenuClick}
        className={cn(
          "flex items-center rounded-card text-sm font-medium transition-all duration-200",
          isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3",
          isActive
            ? isAdmin
              ? "bg-purple-50 text-purple-600"
              : "bg-indigo-50 text-indigo-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon
          className={cn(
            "w-5 h-5 shrink-0",
            isActive
              ? isAdmin
                ? "text-purple-600"
                : "text-indigo-600"
              : "text-slate-400"
          )}
        />
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    );
  }

  // If collapsed and has children, navigate to first child on click
  if (isCollapsed) {
    const firstChild = item.children![0];
    return (
      <Link
        href={firstChild.href}
        onClick={onMenuClick}
        className={cn(
          "flex items-center rounded-card text-sm font-medium transition-all duration-200",
          "justify-center px-3 py-3",
          isParentActive
            ? isAdmin
              ? "bg-purple-50 text-purple-600"
              : "bg-indigo-50 text-indigo-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
        title={item.name}
      >
        <item.icon
          className={cn(
            "w-5 h-5 shrink-0",
            isParentActive
              ? isAdmin
                ? "text-purple-600"
                : "text-indigo-600"
              : "text-slate-400"
          )}
        />
      </Link>
    );
  }

  // Expanded mode with collapsible children
  return (
    <div className="space-y-1">
      {/* Parent item (clickable to expand/collapse) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center rounded-card text-sm font-medium transition-all duration-200",
          "gap-3 px-4 py-3",
          isParentActive || isAnyChildActive
            ? isAdmin
              ? "bg-purple-50 text-purple-600"
              : "bg-indigo-50 text-indigo-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <item.icon
          className={cn(
            "w-5 h-5 shrink-0",
            isParentActive || isAnyChildActive
              ? isAdmin
                ? "text-purple-600"
                : "text-indigo-600"
              : "text-slate-400"
          )}
        />
        <span className="flex-1 text-left">{item.name}</span>
        <ChevronDownIcon
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200",
            isExpanded ? "rotate-180" : "",
            isParentActive || isAnyChildActive
              ? isAdmin
                ? "text-purple-600"
                : "text-indigo-600"
              : "text-slate-400"
          )}
        />
      </button>

      {/* Children items */}
      {isExpanded && (
        <div className="space-y-1 pl-4">
          {item.children!.map((child) => {
            const isThisChildActive =
              normalizedPathname === normalizePath(child.href);
            return (
              <Link
                key={child.name}
                href={child.href}
                onClick={onMenuClick}
                className={cn(
                  "flex items-center rounded-card text-sm font-medium transition-all duration-200",
                  "gap-3 px-4 py-2.5",
                  isThisChildActive
                    ? isAdmin
                      ? "bg-purple-50/50 text-purple-600"
                      : "bg-indigo-50/50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <child.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isThisChildActive
                      ? isAdmin
                        ? "text-purple-600"
                        : "text-indigo-600"
                      : "text-slate-400"
                  )}
                />
                <span>{child.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
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

function BoxIcon({ className }: { className?: string }) {
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

function UserIcon({ className }: { className?: string }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
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
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function TagsIcon({ className }: { className?: string }) {
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
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
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
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"
      />
    </svg>
  );
}

function InventoryIcon({ className }: { className?: string }) {
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}
