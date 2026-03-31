"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import { Settings, Store, Bell, Shield, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  useAuthGuard();

  const settingsSections = [
    {
      id: "profile",
      icon: User,
      title: t("profile.title"),
      description: t("profile.description"),
    },
    {
      id: "business",
      icon: Store,
      title: t("business.title"),
      description: t("business.description"),
    },
    {
      id: "notifications",
      icon: Bell,
      title: t("notifications.title"),
      description: t("notifications.description"),
    },
    {
      id: "security",
      icon: Shield,
      title: t("security.title"),
      description: t("security.description"),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600" />
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.id === "notifications" ? (
                  <Link href="/dashboard/settings/notifications">
                    <Button variant="outline" className="w-full">
                      {tc("buttons.configure")}
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="w-full">
                    {tc("buttons.configure")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
