"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
  const [selectedProfileId, setSelectedProfileId] = useState<string>("none");

  const { data: user, isLoading: isLoadingUser } = useUser(id);
  const { data: permissions, isLoading: isLoadingPermissions } =
    useUserPermissions(id);
  const { data: profiles, isLoading: isLoadingProfiles } =
    useOperatorProfiles();
  const assignProfile = useAssignOperatorProfile();

  // Set initial selected profile when permissions load
  useEffect(() => {
    if (permissions?.operatorProfile?.id) {
      setSelectedProfileId(permissions.operatorProfile.id);
    } else {
      setSelectedProfileId("none");
    }
  }, [permissions]);

  const handleBack = () => {
    router.push("/dashboard/settings");
  };

  const handleAssignProfile = () => {
    assignProfile.mutate({
      userId: id,
      profileId: selectedProfileId === "none" ? null : selectedProfileId,
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
      <div className="space-y-6">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab navigation — mismo patrón que ViewToggle */}
          <div
            className="inline-flex bg-white border border-slate-100 rounded-lg p-1 gap-1"
            role="tablist"
          >
            {(
              [
                { value: "general", icon: User, label: t("tabs.general") },
                { value: "permissions", icon: Shield, label: t("tabs.permissions") },
                { value: "branches", icon: Building2, label: t("tabs.branches") },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={activeTab === value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === value
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>{t("general.title")}</CardTitle>
                <CardDescription>{t("general.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label={t("general.fields.name")}
                    value={user.name}
                    readOnly
                    className="bg-white/60"
                  />
                  <Input
                    label={t("general.fields.email")}
                    value={user.email}
                    readOnly
                    className="bg-white/60"
                  />
                  <Input
                    label={t("general.fields.role")}
                    value={t(`roles.${user.role}`)}
                    readOnly
                    className="bg-white/60"
                  />
                  <Input
                    label={tc("fields.created")}
                    value={new Date(user.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    readOnly
                    className="bg-white/60"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            {/* Operator Profile Selector */}
            <Card variant="glass">
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
                        <SelectValue
                          placeholder={t("permissions.selectProfile")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
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
          <TabsContent value="branches" className="space-y-6">
            <BranchAssignmentManager userId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
