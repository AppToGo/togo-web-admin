"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { useLinkStatus } from "next/link";
import { Filter, History, Inbox, MessageCircle, Banknote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { locales, localeLabels, localeFlags } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import {
  useCurrentUser,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { DemoSidebarCard } from "@/features/auth/components/DemoSidebarCard";
import { useLocaleStore } from "@/stores/localeStore";
import { usePosPageStore, type PosMenuEntry } from "@/stores/pos-menu.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusinessSelector } from "@/features/business/components/BusinessSelector";
import { usePaymentAlerts } from "@/features/admin/business-management/hooks/useAdminBusinesses";
import { useShowGlobalCatalog } from "@/features/catalog/hooks";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useUnseenOrdersCount } from "@/features/orders/hooks/useUnseenOrders";
import { useInboxSummary } from "@/features/conversations/hooks/useInboxSummary";
import { useIsBelowDesktop, useIsMobile } from "@/hooks/useIsMobile";


interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onMenuClick?: () => void;
}

/** Referencia estable: sin Caja montada el selector no cambia. */
const NO_POS_ENTRIES: PosMenuEntry[] = [];

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  /**
   * Hijos de acción (sin ruta): los registra la página activa (hoy Caja)
   * para pintarse como submenú. Se limpian al salir de la página.
   */
  actionChildren?: PosMenuEntry[];
  /** Contador rojo junto al item; no se muestra si es 0. */
  badge?: number;
  /**
   * Otras rutas en las que el item (sin hijos) se marca activo: en el
   * teléfono, "Catálogo" sigue activo en Inventario y Categorías.
   */
  activePaths?: string[];
};

const INBOX_HREF = "/dashboard/inbox";
const CONVERSATION_HREFS = [
  INBOX_HREF,
  "/dashboard/conversations",
  "/dashboard/conversation-funnel",
];

/**
 * Menú del teléfono (diseño móvil): los items con submenú pasan a ser un
 * link a su primera pantalla — sus hermanas se alcanzan desde la barra
 * inferior de la sección (Catálogo) o su lista (Configuración) — y las
 * pantallas de conversaciones se agrupan bajo una sola entrada que abre el
 * Inbox, si se tiene acceso a él.
 */
function flattenForPhone(
  items: NavigationItem[],
  { canViewInbox, flattenCatalog }: { canViewInbox: boolean; flattenCatalog: boolean }
): NavigationItem[] {
  const flat = items.map((item): NavigationItem => {
    if (!item.children?.length) return item;
    const children = item.children.map((child) => child.href);
    const isSettings = item.href === "/dashboard/settings";
    // La barra inferior de Catálogo solo existe < md: en la tablet el
    // submenú se mantiene, o no habría cómo llegar a Inventario.
    if (!isSettings && !flattenCatalog) return item;
    return {
      ...item,
      children: undefined,
      // Configuración abre su lista; Catálogo, su primera pantalla.
      href: isSettings ? item.href : item.children[0].href,
      activePaths: [item.href, ...children],
    };
  });
  if (!canViewInbox) return flat;

  const inbox = flat.find((item) => item.href === INBOX_HREF);
  const conversations = flat.find((item) => item.href === "/dashboard/conversations");
  return flat
    .filter((item) => !CONVERSATION_HREFS.includes(item.href) || item.href === INBOX_HREF)
    .map((item) =>
      item.href === INBOX_HREF && inbox
        ? {
            ...inbox,
            name: conversations?.name ?? inbox.name,
            icon: conversations?.icon ?? inbox.icon,
            activePaths: CONVERSATION_HREFS,
          }
        : item
    );
}

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

  // Menú de usuario colapsable (idioma + cerrar sesión) — mismo patrón que
  // LanguageSwitcher, inline acá para compartir un solo DropdownMenu con
  // el logout en vez de anidar dos menús desplegables.
  const router = useRouter();
  const currentLocale = useLocale();
  const { setUserPreference } = useLocaleStore();
  const handleLocaleChange = (locale: Locale) => {
    setUserPreference(locale);
    router.replace(pathname, { locale });
  };

  // Fetch payment alerts for badge
  const { data: paymentAlerts } = usePaymentAlerts(isSuperAdmin);
  const alertCount = paymentAlerts?.length || 0;

  // El catálogo global solo se muestra si el negocio tiene productos
  // disponibles para su industria, o si el usuario es super admin
  const showGlobalCatalog = useShowGlobalCatalog();

  // Gating por rol en cliente, sólo UX — el permiso real (conversation.view)
  // lo aplica el backend (403). Mismo patrón que `canViewHistory` en
  // OrderDetailContent: no hay infraestructura de permission[] en el JWT hoy.
  const canViewConversations =
    user?.role === "OWNER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  // Gating por permiso real (Fase C) — a diferencia de `canViewConversations`
  // de arriba, el inbox es la primera pantalla pensada también para
  // OPERATOR, a quien el gate por rol de arriba excluiría.
  const { hasPermission } = useMyPermissions();
  const canViewInbox = hasPermission("conversation.view");

  // Estado de cuenta / facturación — mismo criterio que canViewInbox: por
  // permiso real, no por rol a mano. OWNER/ADMIN lo tienen siempre
  // (bypass del backend); un OPERATOR sólo si su perfil se lo asigna
  // explícitamente (ver billing.view en permission-catalog.seed.ts).
  const canViewBilling = hasPermission("billing.view");

  // Embudo del bot (plan bot natural, T20): mismo permiso que su endpoint.
  const canViewConversationFunnel = hasPermission("metrics.view");

  // Caja (docs/caja-pedidos.md): mismo permiso que sus endpoints de lectura.
  const canViewCash = hasPermission("cash.view");
  // Submenú de Caja: lo registra CashPosPage mientras está montada.
  const posMenuEntries = usePosPageStore(
    (state) => state.page?.entries ?? NO_POS_ENTRIES
  );

  // Badges: pedidos nuevos sin ver (por negocio, sucursales seleccionadas) y
  // conversaciones que esperan asesor. Los refrescan los sockets globales de
  // DashboardRealtime. SUPER_ADMIN no tiene negocio propio ni socket.
  const unseenOrdersCount = useUnseenOrdersCount(
    !isSuperAdmin && hasPermission("order.view")
  );
  const { data: inboxSummary } = useInboxSummary(!isSuperAdmin && canViewInbox);
  const inboxAttentionCount = inboxSummary?.needsAttention ?? 0;

  // Teléfono y tablet (< lg, el Sidebar es un cajón): Configuración va
  // directo a su lista y las tres de conversaciones se agrupan en una (sus
  // pantallas existen hasta lg). Catálogo solo en el teléfono (< md), donde
  // está su barra inferior.
  const isBelowDesktop = useIsBelowDesktop();
  const isMobile = useIsMobile();

  // Navigation items with translation keys
  const navigation: NavigationItem[] = React.useMemo(() => {
    // Las pantallas de conversaciones van juntas, después de Pedidos y
    // Caja: el Inbox es tan operativo como el tablero.
    const conversationScreens: NavigationItem[] = [
      ...(canViewInbox
        ? [
            {
              name: t("sidebar.inbox"),
              href: INBOX_HREF,
              icon: Inbox,
              badge: inboxAttentionCount,
            },
          ]
        : []),
      ...(canViewConversations
        ? [
            {
              // En el escritorio va dentro del grupo "Conversaciones":
              // ahí se llama "Historial" para no repetir el nombre.
              name: isBelowDesktop
                ? t("sidebar.conversations")
                : t("sidebar.conversationHistory"),
              href: "/dashboard/conversations",
              icon: isBelowDesktop ? MessageCircle : History,
            },
          ]
        : []),
      ...(canViewConversationFunnel
        ? [
            {
              name: t("sidebar.conversationFunnel"),
              href: "/dashboard/conversation-funnel",
              icon: Filter,
            },
          ]
        : []),
    ];
    // Escritorio: un grupo "Conversaciones" con submenú. Teléfono y tablet
    // las reciben sueltas: flattenForPhone ya las junta en una sola entrada.
    const conversationItems: NavigationItem[] =
      !isBelowDesktop && conversationScreens.length > 1
        ? [
            {
              name: t("sidebar.conversations"),
              href: conversationScreens[0].href,
              icon: MessageCircle,
              badge: inboxAttentionCount,
              children: conversationScreens,
            },
          ]
        : conversationScreens;

    // Orden: Dashboard, Pedidos, Caja, Conversaciones, Clientes, Catálogo y
    // Configuración.
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
        badge: unseenOrdersCount,
      },
      ...(canViewCash
        ? [
            {
              name: t("sidebar.cash"),
              href: "/dashboard/cash",
              icon: Banknote,
              ...(posMenuEntries.length > 0
                ? { actionChildren: posMenuEntries }
                : {}),
            },
          ]
        : []),
      ...conversationItems,
      {
        name: t("sidebar.customers"),
        href: "/dashboard/customers",
        icon: UsersIcon,
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
          ...(showGlobalCatalog
            ? [
                {
                  name: t("sidebar.globalCatalog"),
                  href: "/dashboard/catalog/global",
                  icon: GlobeIcon,
                },
              ]
            : []),
          {
            name: t("sidebar.categories"),
            href: "/dashboard/catalog/categories",
            icon: TagsIcon,
          },
        ],
      },
      {
        name: t("sidebar.settings"),
        href: "/dashboard/settings",
        icon: SettingsIcon,
        children: [
          {
            name: t("sidebar.business"),
            href: "/dashboard/settings/general/business",
            icon: StoreIcon,
          },
          {
            name: t("sidebar.branches"),
            href: "/dashboard/branches",
            icon: BuildingIcon,
          },
          {
            name: t("sidebar.users"),
            href: "/dashboard/settings/users",
            icon: UsersIcon,
          },
          {
            name: t("sidebar.operatorProfiles"),
            href: "/dashboard/settings/operator-profiles",
            icon: ShieldIcon,
          },
          {
            name: t("sidebar.notifications"),
            href: "/dashboard/settings/notifications",
            icon: BellIcon,
          },
          ...(canViewBilling
            ? [
                {
                  name: t("sidebar.billing"),
                  href: "/dashboard/settings/billing",
                  icon: CreditCardIcon,
                },
              ]
            : []),
        ],
      },
    ];

    return isBelowDesktop
      ? flattenForPhone(items, { canViewInbox, flattenCatalog: isMobile })
      : items;
  }, [
    isBelowDesktop,
    isMobile,
    t,
    showGlobalCatalog,
    canViewConversations,
    canViewConversationFunnel,
    canViewInbox,
    canViewBilling,
    canViewCash,
    unseenOrdersCount,
    inboxAttentionCount,
    posMenuEntries,
  ]);

  // Admin navigation (Super Admin only)
  const adminNavigation: NavigationItem[] = [
    {
      name: t("sidebar.businesses"),
      href: "/admin/businesses",
      icon: BuildingStoreIcon,
      badge: alertCount,
    },
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
    {
      name: t("sidebar.demoLeads"),
      href: "/admin/demo-leads",
      icon: LeadsIcon,
    },
    {
      name: t("sidebar.aiUsage"),
      href: "/admin/ai-usage",
      icon: SparklesIcon,
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
        data-tour-step="sidebar"
        className={cn(
          "fixed top-0 left-0 z-50 h-full",
          "flex flex-col",
          "glass-strong border-r border-white/50",
          "transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          !isOpen && "-translate-x-full",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 shrink-0 flex items-center justify-center border-b border-slate-100/50">
          <Link
            href="/dashboard/orders"
            onClick={onMenuClick}
            className="flex items-center gap-3"
          >
            <Image
              src="/logo.png"
              alt="Togo"
              width={36}
              height={36}
              className="rounded-full shrink-0 shadow-card"
              priority
            />
            {!isCollapsed && (
              <span className="font-bold text-xl text-slate-900">Togo</span>
            )}
          </Link>
        </div>

        {/* Business Selector (solo SUPER_ADMIN) */}
        {!isCollapsed && <BusinessSelector />}

        {/*
          Zona con scroll propio: con varios ítems del menú desplegados
          (children de "Configuración", etc.) la lista puede superar el
          alto de la pantalla — antes no había overflow acá, así que las
          últimas opciones quedaban ocultas detrás de la sección de
          usuario sin ninguna forma de llegar a ellas. `min-h-0` es
          necesario para que un hijo flex con `flex-1` respete
          `overflow-y-auto` en vez de crecer al tamaño de su contenido.
        */}
        <div className="flex-1 min-h-0 overflow-y-auto">
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
        </div>

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

        {/* Modo demo: invitación a crear cuenta (reemplaza el banner superior) */}
        <DemoSidebarCard isCollapsed={isCollapsed} />

        {/* Bottom section - Menú de usuario (idioma + cerrar sesión) */}
        <div
          className={cn(
            "shrink-0 border-t border-slate-100/50",
            isCollapsed ? "p-2" : "p-3"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center rounded-card bg-slate-50/80 hover:bg-slate-100 transition-colors outline-none",
                  isCollapsed ? "justify-center p-2" : "gap-2 px-4 py-3"
                )}
                title={user?.name || t("sidebar.user")}
              >
                {isCollapsed ? (
                  <UserIcon className="w-5 h-5 text-slate-500 shrink-0" />
                ) : (
                  <>
                    <span className="flex-1 min-w-0 text-left text-sm font-medium text-slate-900 truncate">
                      {user?.name || t("sidebar.user")}
                    </span>
                    <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || t("sidebar.user")}
                </p>
                {user?.email && (
                  <p className="text-xs text-slate-500 truncate font-normal">
                    {user.email}
                  </p>
                )}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-slate-400">
                {t("language.title")}
              </DropdownMenuLabel>
              {locales.map((locale) => (
                <DropdownMenuItem
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={cn(
                    "gap-2 cursor-pointer",
                    currentLocale === locale && "bg-accent"
                  )}
                >
                  <span>{localeFlags[locale]}</span>
                  <span>{localeLabels[locale]}</span>
                  {currentLocale === locale && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      ✓
                    </span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogoutIcon className="w-4 h-4 mr-2" />
                {t("sidebar.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  const linkChildren = item.children ?? [];
  const actionChildren = item.actionChildren ?? [];

  // Abierto si un hijo está activo, salvo que el usuario lo pliegue o
  // despliegue a mano. Derivado (no estado inicial): los hijos de acción
  // de Caja se registran después de montar la página, y con un estado
  // inicial el submenú arrancaba plegado.
  const [manualExpanded, setIsExpanded] = useState<boolean | null>(null);
  const autoExpanded =
    linkChildren.some((child) =>
      normalizedPathname.startsWith(normalizePath(child.href))
    ) || actionChildren.some((child) => child.active);
  const isExpanded = manualExpanded ?? autoExpanded;

  const hasChildren = linkChildren.length > 0 || actionChildren.length > 0;

  // Determine active states
  const normalizedItemHref = normalizePath(item.href);
  const isParentActive =
    normalizedPathname === normalizedItemHref ||
    normalizedPathname.startsWith(`${normalizedItemHref}/`);
  const isAnyChildActive =
    linkChildren.some(
      (child) => normalizedPathname === normalizePath(child.href)
    ) || actionChildren.some((child) => child.active);
  // Colapsado solo se ve el ícono del grupo: debe marcarse en cualquiera de
  // sus pantallas, no solo en la del `href` del padre (en "Conversaciones"
  // el padre apunta al Inbox, hermano de Historial y Embudo, no prefijo).
  const isGroupActive =
    isParentActive ||
    isAnyChildActive ||
    linkChildren.some((child) =>
      normalizedPathname.startsWith(`${normalizePath(child.href)}/`)
    );

  // If no children, render as simple Link
  if (!hasChildren) {
    const matches = (href: string) => {
      const path = normalizePath(href);
      return normalizedPathname === path || normalizedPathname.startsWith(`${path}/`);
    };
    const isActive =
      normalizedItemHref === "/dashboard"
        ? normalizedPathname === "/dashboard"
        : matches(item.href) || (item.activePaths ?? []).some(matches);
    return (
      <Link
        href={item.href}
        onClick={onMenuClick}
        className={cn(
          "relative flex items-center rounded-card text-sm font-medium transition-all duration-200",
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
        <NavBadge count={item.badge} isCollapsed={isCollapsed} />
        <NavLinkPending isCollapsed={isCollapsed} />
      </Link>
    );
  }

  // Colapsado con hijos de acción (pestañas de Caja): el ícono abre un menú
  // con ellas; sin esto no habría cómo cambiar de pestaña sin desplegar la
  // barra.
  if (isCollapsed && actionChildren.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative flex w-full items-center rounded-card text-sm font-medium transition-all duration-200",
              "justify-center px-3 py-3",
              isGroupActive
                ? isAdmin
                  ? "bg-purple-50 text-purple-600"
                  : "bg-indigo-50 text-indigo-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
            title={item.name}
            aria-label={item.name}
          >
            <item.icon
              className={cn(
                "w-5 h-5 shrink-0",
                isGroupActive
                  ? isAdmin
                    ? "text-purple-600"
                    : "text-indigo-600"
                  : "text-slate-400"
              )}
            />
            <NavBadge count={item.badge} isCollapsed />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionChildren.map((child) => (
            <DropdownMenuItem
              key={child.id}
              aria-current={child.active ? "page" : undefined}
              onSelect={() => {
                child.onSelect();
                onMenuClick?.();
              }}
              className={cn(
                child.active && "bg-indigo-50 font-medium text-indigo-700"
              )}
            >
              <span className="flex-1">{child.label}</span>
              {child.count !== undefined && child.count > 0 && (
                <span className="rounded-full bg-slate-200 px-1.5 text-xs font-semibold tabular-nums text-slate-700">
                  {child.count}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If collapsed and has children, navigate to first child on click.
  if (isCollapsed) {
    const firstChild = linkChildren[0];
    return (
      <Link
        href={firstChild.href}
        onClick={onMenuClick}
        className={cn(
          "relative flex items-center rounded-card text-sm font-medium transition-all duration-200",
          "justify-center px-3 py-3",
          isGroupActive
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
            isGroupActive
              ? isAdmin
                ? "text-purple-600"
                : "text-indigo-600"
              : "text-slate-400"
          )}
        />
        <NavBadge count={item.badge} isCollapsed />
        <NavLinkPending isCollapsed />
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
        {/* Abierto, el contador lo muestra el hijo (Inbox). */}
        {!isExpanded && <CountBadge count={item.badge} />}
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
          {linkChildren.map((child) => {
            const isThisChildActive =
              normalizedPathname === normalizePath(child.href);
            return (
              <Link
                key={child.name}
                href={child.href}
                onClick={onMenuClick}
                className={cn(
                  "relative flex items-center rounded-card text-sm font-medium transition-all duration-200",
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
                <NavBadge count={child.badge} />
                <NavLinkPending />
              </Link>
            );
          })}
          {actionChildren.map((child) => (
            <button
              key={child.id}
              type="button"
              aria-current={child.active ? "page" : undefined}
              onClick={() => {
                child.onSelect();
                onMenuClick?.();
              }}
              className={cn(
                "w-full flex items-center rounded-card text-sm font-medium transition-all duration-200",
                "gap-2 px-4 py-2.5",
                child.active
                  ? isAdmin
                    ? "bg-purple-50/50 text-purple-600"
                    : "bg-indigo-50/50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span className="flex-1 text-left">{child.label}</span>
              {child.count !== undefined && child.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                    child.active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {child.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Contador del encabezado de un grupo (un <button>, fuera de un <Link>, así
// que sin el estado de carga de NavBadge).
function CountBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="min-w-5 h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold px-1.5 rounded-badge">
      {badgeLabel(count)}
    </span>
  );
}

// Mismo tope en el encabezado del grupo y en sus hijos.
function badgeLabel(count: number): string {
  return count > 9 ? "9+" : String(count);
}

// Contador rojo del item (pedidos nuevos, inbox, alertas de pago). Expandido
// va al final de la fila; colapsado, en la esquina del ícono. Se oculta
// mientras carga la ruta: el spinner de NavLinkPending ocupa el mismo lugar.
// Debe renderizarse dentro del <Link>.
function NavBadge({
  count,
  isCollapsed = false,
}: {
  count?: number;
  isCollapsed?: boolean;
}) {
  const { pending } = useLinkStatus();
  if (!count || count <= 0 || pending) return null;
  return (
    <span
      className={cn(
        "min-w-5 h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold px-1.5 rounded-badge",
        isCollapsed ? "absolute top-1 right-1" : "ml-auto"
      )}
    >
      {badgeLabel(count)}
    </span>
  );
}

/**
 * Spinner shown on the clicked menu item while its route loads, so the click
 * gets instant feedback even before the next page (or its loading state)
 * renders. Must be rendered inside the <Link>.
 */
function NavLinkPending({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute rounded-full border-2 border-current border-t-transparent animate-spin",
        isCollapsed
          ? "top-1 right-1 w-3 h-3"
          : "right-3 top-1/2 -translate-y-1/2 w-4 h-4"
      )}
    />
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

function CreditCardIcon({ className }: { className?: string }) {
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
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-9-11.25h16.5a1.5 1.5 0 011.5 1.5v9.75a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z"
      />
    </svg>
  );
}

function LeadsIcon({ className }: { className?: string }) {
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
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
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

function StoreIcon({ className }: { className?: string }) {
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
        d="M3 3h18v18H3zM9 9h6v6H9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9h18M9 3v6M15 3v6"
      />
    </svg>
  );
}

function BuildingStoreIcon({ className }: { className?: string }) {
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
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}
