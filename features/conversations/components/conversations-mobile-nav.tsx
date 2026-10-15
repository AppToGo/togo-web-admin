"use client";

/**
 * Barra inferior de las pantallas de conversaciones en el teléfono (< lg):
 * Inbox · Sin pedido · Embudo del bot, cada una con el mismo permiso que su
 * entrada en el Sidebar. Con una sola visible no se muestra.
 */

import { useTranslations } from "next-intl";
import { Filter, Inbox, MessageCircle, type LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

export function ConversationsMobileNav() {
  const t = useTranslations("navigation.sidebar");
  const tc = useTranslations("conversations");
  const pathname = usePathname();
  const user = useCurrentUser();
  const { hasPermission } = useMyPermissions();

  const items: Array<{ href: string; label: string; icon: LucideIcon; show: boolean }> = [
    {
      href: "/dashboard/inbox",
      label: t("inbox"),
      icon: Inbox,
      show: hasPermission("conversation.view"),
    },
    {
      href: "/dashboard/conversations",
      label: tc("mobile.withoutOrder"),
      icon: MessageCircle,
      // Mismo gate por rol que la entrada del Sidebar.
      show:
        user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
    },
    {
      href: "/dashboard/conversation-funnel",
      label: t("conversationFunnel"),
      icon: Filter,
      show: hasPermission("metrics.view"),
    },
  ];
  const visible = items.filter((item) => item.show);
  if (visible.length < 2) return null;

  return (
    <>
      {/* Reserva el alto de la barra al final del contenido. */}
      <div aria-hidden className="h-20 lg:hidden" />
      <nav
        aria-label={t("conversations")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        data-testid="conversations-mobile-nav"
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
