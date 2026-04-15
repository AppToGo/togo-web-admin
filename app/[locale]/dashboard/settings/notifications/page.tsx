"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import { Bell, Volume2, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useNotificationPreferences,
  useHydrateNotificationPreferences,
} from "@/features/notifications/stores/notification-preferences.store";

export default function NotificationSettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const {
    enableSounds,
    enableNotifications,
    setEnableSounds,
    setEnableNotifications,
  } = useNotificationPreferences();

  // Rehydrate persisted preferences from localStorage on mount
  useHydrateNotificationPreferences();

  useAuthGuard();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-indigo-600" />
            {t("notifications.title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("notifications.description")}
          </p>
        </div>

        {/* Sound Alerts Card */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {t("notifications.soundAlerts.title")}
                </CardTitle>
                <CardDescription>
                  {t("notifications.soundAlerts.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-alerts" className="text-sm font-medium">
                  {t("notifications.soundAlerts.enable")}
                </Label>
                <p className="text-xs text-slate-500">
                  {t("notifications.soundAlerts.help")}
                </p>
              </div>
              <Switch
                id="sound-alerts"
                checked={enableSounds}
                onCheckedChange={setEnableSounds}
              />
            </div>
          </CardContent>
        </Card>

        {/* Toast Notifications Card */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {t("notifications.toastNotifications.title")}
                </CardTitle>
                <CardDescription>
                  {t("notifications.toastNotifications.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="toast-notifications"
                  className="text-sm font-medium"
                >
                  {t("notifications.toastNotifications.enable")}
                </Label>
                <p className="text-xs text-slate-500">
                  {t("notifications.toastNotifications.help")}
                </p>
              </div>
              <Switch
                id="toast-notifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium">
              {t("notifications.note.title")}:{" "}
            </span>
            {t("notifications.note.description")}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
