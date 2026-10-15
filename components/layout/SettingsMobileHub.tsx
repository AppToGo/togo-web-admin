"use client";

/**
 * Configuración en el teléfono y la tablet (< lg), según el diseño móvil:
 * las pantallas de configuración agrupadas (Negocio · Equipo · Cuenta) en
 * una lista, en vez del submenú del Sidebar. En escritorio la ruta
 * redirige a Datos del negocio, como siempre.
 */

import { useTranslations } from "next-intl";
import {
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  MessageSquareText,
  Shield,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { BOT_MESSAGES_PERMISSION } from "@/features/bot-messages";

interface HubItem {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  show?: boolean;
}

export function SettingsMobileHub() {
  const t = useTranslations("navigation.sidebar");
  const th = useTranslations("navigation.settingsHub");
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();

  const groups: Array<{ title: string; items: HubItem[] }> = [
    {
      title: th("groups.business"),
      items: [
        {
          href: "/dashboard/settings/general/business",
          title: t("business"),
          description: th("business"),
          icon: Store,
        },
        { href: "/dashboard/branches", title: t("branches"), description: th("branches"), icon: Building2 },
        {
          href: "/dashboard/settings/general/bot-messages",
          title: th("botMessagesTitle"),
          description: th("botMessages"),
          icon: MessageSquareText,
          // Mismo permiso que el enlace de Datos del negocio: sin él la
          // pantalla solo dice "sin acceso".
          show: permissionsLoading || hasPermission(BOT_MESSAGES_PERMISSION),
        },
      ],
    },
    {
      title: th("groups.team"),
      items: [
        { href: "/dashboard/settings/users", title: t("users"), description: th("users"), icon: Users },
        {
          href: "/dashboard/settings/operator-profiles",
          title: t("operatorProfiles"),
          description: th("operatorProfiles"),
          icon: Shield,
        },
      ],
    },
    {
      title: th("groups.account"),
      items: [
        {
          href: "/dashboard/settings/notifications",
          title: t("notifications"),
          description: th("notifications"),
          icon: Bell,
        },
        {
          href: "/dashboard/settings/billing",
          title: t("billing"),
          description: th("billing"),
          icon: CreditCard,
          // Mismo permiso que la entrada del Sidebar.
          show: hasPermission("billing.view"),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="settings-mobile-hub">
      {groups.map((group) => {
        const items = group.items.filter((item) => item.show !== false);
        if (items.length === 0) return null;
        return (
          <section key={group.title} aria-label={group.title} className="flex flex-col gap-2">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {group.title}
            </span>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="flex min-h-16 items-center gap-3 px-3.5 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[15px] font-semibold text-slate-900">{item.title}</span>
                        <span className="truncate text-xs text-slate-500">{item.description}</span>
                      </span>
                      <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-slate-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
