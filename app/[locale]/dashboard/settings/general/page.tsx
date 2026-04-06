"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import {
  Settings,
  Store,
  Bell,
  Shield,
  User,
  Users,
  Building2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { useBranches } from "@/features/branches";
import { useCurrentUser } from "@/features/auth/stores/auth.store";

export default function GeneralSettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tn = useTranslations("navigation");
  const tb = useTranslations("branches");

  useAuthGuard();

  const user = useCurrentUser();
  const { data: branches, isLoading, error } = useBranches();

  // Manejar estado de carga
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Manejar error al cargar sedes
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tb("errors.loadingFailed")}</AlertTitle>
            <AlertDescription>
              {tb("errors.loadingFailedDescription")}
              <br />
              <code className="text-xs mt-2 block">{error.message}</code>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Manejar usuario sin negocio asignado
  if (!user?.businessId && user?.role !== 'SUPER_ADMIN') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tb("noBusiness.title")}</AlertTitle>
            <AlertDescription>
              {tb("noBusiness.description")}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Manejar SUPER_ADMIN sin negocio seleccionado
  if (user?.role === 'SUPER_ADMIN' && !branches) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tb("errors.selectBusiness")}</AlertTitle>
            <AlertDescription>
              {tb("errors.selectBusinessDescription")}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Manejar sin sedes
  if (!branches || branches.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {tb("empty.title")}
          </h2>
          <p className="text-slate-500 mb-6">
            {tb("empty.description")}
          </p>
          <Link href="/dashboard/branches/new">
            <Button>
              {tb("createBranch")}
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Settings sections - Menu de navegación siempre visible
  const settingsSections = [
    {
      id: "business",
      icon: Store,
      title: t("business.title"),
      description: t("business.description"),
      href: "/dashboard/settings/general/business",
    },
    {
      id: "branches",
      icon: Building2,
      title: tn("sidebar.branches"),
      description: t("branches.description"),
      href: "/dashboard/branches",
    },
    {
      id: "users",
      icon: Users,
      title: tn("sidebar.users"),
      description: t("users.description"),
      href: "/dashboard/settings/users",
    },
    {
      id: "operatorProfiles",
      icon: Shield,
      title: tn("sidebar.operatorProfiles"),
      description: t("operatorProfiles.description"),
      href: "/dashboard/settings/operator-profiles",
    },
    {
      id: "notifications",
      icon: Bell,
      title: t("notifications.title"),
      description: t("notifications.description"),
      href: "/dashboard/settings/notifications",
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <Link href={section.href}>
                  <Button variant="outline" className="w-full">
                    {tc("buttons.configure")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
