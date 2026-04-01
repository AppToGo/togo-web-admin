"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
  useAuthStore,
} from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Shield, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api.service";

// Features
import {
  UserPermissionView,
  BranchAssignmentManager,
  useUserPermissions,
  USER_PERMISSIONS_KEYS,
} from "@/features/user-permissions";
import { useOperatorProfiles } from "@/features/operator-profiles";

/**
 * User type for user details
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch user details from the backend
 */
function useUser(userId: string | null) {
  const { user: currentUser } = useAuthStore();
  const businessId = currentUser?.businessId;

  return useQuery({
    queryKey: ["users", businessId, userId],
    queryFn: async () => {
      if (!businessId || !userId) return null;
      const { data } = await apiClient.get<User>(
        `/businesses/${businessId}/users/${userId}`
      );
      return data;
    },
    enabled: !!businessId && !!userId,
  });
}

/**
 * Hook to assign operator profile to user
 */
function useAssignOperatorProfile() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const businessId = currentUser?.businessId;
  const t = useTranslations("userPermissions");

  return useMutation({
    mutationFn: async ({
      userId,
      profileId,
    }: {
      userId: string;
      profileId: string | null;
    }) => {
      if (!businessId) throw new Error("No business ID");
      const { data } = await apiClient.patch(
        `/businesses/${businessId}/users/${userId}`,
        {
          operatorProfileId: profileId,
        }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate user data and permissions
      queryClient.invalidateQueries({ queryKey: ["users", businessId] });
      queryClient.invalidateQueries({
        queryKey: USER_PERMISSIONS_KEYS.permissions(variables.userId),
      });
      toast.success(t("profileAssigned"));
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t("errors.assignFailed");
      toast.error(message);
    },
  });
}

export default function UserDetailPage() {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const params = useParams();
  const id = params.id as string;
  const locale = params.locale as string;

  const [activeTab, setActiveTab] = useState("general");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const { data: user, isLoading: isLoadingUser } = useUser(id);
  const { data: permissions, isLoading: isLoadingPermissions } = useUserPermissions(id);
  const { data: profiles, isLoading: isLoadingProfiles } = useOperatorProfiles();
  const assignProfile = useAssignOperatorProfile();

  // Set initial selected profile when permissions load
  useState(() => {
    if (permissions?.operatorProfile?.id) {
      setSelectedProfileId(permissions.operatorProfile.id);
    }
  });

  const handleBack = () => {
    router.push("/dashboard/settings");
  };

  const handleAssignProfile = () => {
    assignProfile.mutate({
      userId: id,
      profileId: selectedProfileId || null,
    });
  };

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("noBusiness.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("noBusiness.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoadingUser) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("notFound.description")}
          </p>
          <Button onClick={handleBack}>{tc("buttons.back")}</Button>
        </div>
      </DashboardLayout>
    );
  }

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
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
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
              <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                {t(`roles.${user.role}`)}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t("tabs.permissions")}
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t("tabs.branches")}
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("general.title")}</CardTitle>
                <CardDescription>{t("general.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      {t("general.fields.name")}
                    </label>
                    <p className="text-slate-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      {t("general.fields.email")}
                    </label>
                    <p className="text-slate-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      {t("general.fields.role")}
                    </label>
                    <p className="text-slate-900">{t(`roles.${user.role}`)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      {tc("fields.created")}
                    </label>
                    <p className="text-slate-900">
                      {new Date(user.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="mt-6 space-y-6">
            {/* Operator Profile Selector */}
            <Card>
              <CardHeader>
                <CardTitle>{t("permissions.operatorProfile")}</CardTitle>
                <CardDescription>
                  {t("permissions.operatorProfileDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProfiles ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedProfileId}
                      onValueChange={setSelectedProfileId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t("permissions.selectProfile")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          {t("permissions.noProfile")}
                        </SelectItem>
                        {profiles?.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={handleAssignProfile}
                      disabled={assignProfile.isPending}
                    >
                      {assignProfile.isPending
                        ? tc("buttons.saving")
                        : t("permissions.assignProfile")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Permissions View */}
            <UserPermissionView
              permissions={permissions}
              isLoading={isLoadingPermissions}
            />
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="mt-6">
            <BranchAssignmentManager userId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
