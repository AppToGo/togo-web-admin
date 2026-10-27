"use client";

/**
 * Barra inferior de las pantallas de conversaciones en el teléfono (< lg):
 * Inbox · Sin pedido · Embudo del bot, cada una con el mismo permiso que su
 * entrada en el Sidebar.
 */

import { useTranslations } from "next-intl";
import { Filter, Inbox, MessageCircle } from "lucide-react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { isPlatformStaffRole } from "@/lib/auth/platform-staff";

export function ConversationsMobileNav() {
  const t = useTranslations("navigation.sidebar");
  const tc = useTranslations("conversations");
  const user = useCurrentUser();
  const { hasPermission } = useMyPermissions();

  return (
    <MobileBottomNav
      label={t("conversations")}
      hiddenFrom="lg"
      testId="conversations-mobile-nav"
      items={[
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
            user?.role === "OWNER" || user?.role === "ADMIN" || isPlatformStaffRole(user?.role),
        },
        {
          href: "/dashboard/conversation-funnel",
          label: t("conversationFunnel"),
          icon: Filter,
          show: hasPermission("metrics.view"),
        },
      ]}
    />
  );
}
