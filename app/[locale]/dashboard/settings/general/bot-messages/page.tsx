"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { BotMessagesPage } from "@/features/bot-messages";

/** Mensajes del asistente (plan bot natural, T22). */
export default function BotMessagesSettingsPage() {
  useAuthGuard();

  return (
    <DashboardLayout>
      <BotMessagesPage />
    </DashboardLayout>
  );
}
