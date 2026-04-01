"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import { Users, Plus, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/routing";
import { useUsers } from "@/features/users/hooks/useUsers";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();

  const { data: users, isLoading } = useUsers();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "BUSINESS_OWNER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "OPERATOR":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1">{t("subtitle")}</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t("buttons.addUser")}
          </Button>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>{t("list.title")}</CardTitle>
            <CardDescription>{t("list.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {t("empty.title")}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                  {t("empty.description")}
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("buttons.addUser")}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users?.map((user) => (
                  <Link
                    key={user.id}
                    href={`/dashboard/users/${user.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-lg group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {user.name}
                        </h3>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(getRoleBadgeColor(user.role))}
                      >
                        {t(`roles.${user.role}`)}
                      </Badge>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className={cn(
                          user.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {user.isActive ? tc("status.active") : tc("status.inactive")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
