"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Shield,
  UserCircle,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserPermissions } from "../types";

interface UserPermissionViewProps {
  permissions: UserPermissions | undefined;
  isLoading?: boolean;
}

/**
 * Componente para mostrar la vista de solo lectura de permisos de usuario
 *
 * Muestra:
 * - Badge con el rol del usuario
 * - Tarjeta de perfil de operador (si está asignado)
 * - Lista de permisos agrupados por dominio
 */
export const UserPermissionView = memo(function UserPermissionView({
  permissions,
  isLoading = false,
}: UserPermissionViewProps) {
  const t = useTranslations("userPermissions");
  const tCommon = useTranslations("common");

  // Agrupar permisos por dominio
  const permissionsByDomain = permissions?.permissions.reduce((acc, permission) => {
    const domain = permission.split(":")[0] || "general";
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(permission);
    return acc;
  }, {} as Record<string, string[]>);

  const domains = permissionsByDomain ? Object.keys(permissionsByDomain).sort() : [];

  // Obtener color según el rol
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "ADMIN":
        return "bg-red-100 text-red-700 border-red-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "OPERATOR":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (isLoading) {
    return <UserPermissionViewSkeleton />;
  }

  if (!permissions) {
    return (
      <Card variant="glass" className="p-8">
        <div className="text-center text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>{t("noPermissions")}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con rol */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("userRole")}</CardTitle>
                <CardDescription>{t("roleDescription")}</CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-sm font-semibold px-3 py-1",
                getRoleBadgeVariant(permissions.role)
              )}
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              {permissions.role}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Perfil de operador */}
      {permissions.operatorProfile && (
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("operatorProfile.label")}</CardTitle>
                <CardDescription>{t("operatorProfileDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {permissions.operatorProfile.name}
                </p>
                <p className="text-sm text-slate-500 font-mono">
                  ID: {permissions.operatorProfile.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permisos por dominio */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("permissions.title")}</CardTitle>
              <CardDescription>
                {t("permissionsCount", { count: permissions.permissions.length })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>{t("noPermissionsAssigned")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain} className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {domain}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {permissionsByDomain?.[domain]?.map((permission) => (
                      <Badge
                        key={permission}
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200 font-mono text-xs"
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fecha de cómputo */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {t("permissions.computedAt")}: {new Date(permissions.computedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
});

/**
 * Skeleton loader para UserPermissionView
 */
function UserPermissionViewSkeleton() {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="w-32 h-5" />
                <Skeleton className="w-48 h-4" />
              </div>
            </div>
            <Skeleton className="w-24 h-8" />
          </div>
        </CardHeader>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="w-40 h-5" />
              <Skeleton className="w-56 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-16 rounded-lg" />
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="w-24 h-5" />
              <Skeleton className="w-32 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
