"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { BotMessagesPage } from "@/features/bot-messages";
import { FeaturePage } from "@/features/business-features/components/FeaturePage";

/** Mensajes del asistente (plan bot natural, T22). */
function BotMessagesSettingsPageContent() {
  useAuthGuard();

  return (
    <DashboardLayout>
      <RequirePermission code="settings.view">
        <BotMessagesPage />
      </RequirePermission>
    </DashboardLayout>
  );
}

/** Solo si el negocio tiene activa la funcionalidad (ver /admin/features). */
export default function BotMessagesSettingsPage() {
  return (
    <FeaturePage name="BOT_MESSAGES">
      <BotMessagesSettingsPageContent />
    </FeaturePage>
  );
}
