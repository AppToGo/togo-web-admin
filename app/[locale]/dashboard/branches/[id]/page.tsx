"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Store, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import type {
  Branch,
  UpdateBranchRequest,
} from "@/features/branches/types";
import { getPrimaryWhatsApp } from "@/features/branches/utils/branch-helpers";

// Placeholder BranchForm component - should be imported from features/branches/components
interface BranchFormProps {
  branch?: Branch;
  onSubmit: (data: UpdateBranchRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function BranchForm({ branch, onSubmit, onCancel, isLoading }: BranchFormProps) {
  const tc = useTranslations("common");
  const [formData, setFormData] = useState<UpdateBranchRequest>({
    name: branch?.name || "",
    slug: branch?.slug || "",
    code: branch?.code || "",
    whatsappPhoneNumber: branch?.whatsappPhoneNumber || "",
    whatsappPhoneNumberId: branch?.whatsappPhoneNumberId || "",
    address: branch?.address || "",
    timezone: branch?.timezone || "America/Santiago",
    currency: branch?.currency || "CLP",
    isActive: branch?.isActive ?? true,
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        slug: branch.slug,
        code: branch.code,
        whatsappPhoneNumber: branch.whatsappPhoneNumber || "",
        whatsappPhoneNumberId: branch.whatsappPhoneNumberId || "",
        address: branch.address || "",
        timezone: branch.timezone,
        currency: branch.currency,
        isActive: branch.isActive,
      });
    }
  }, [branch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Código
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Dirección
        </label>
        <input
          type="text"
          value={formData.address || ""}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="isActive" className="text-sm text-slate-700">
          Sede activa
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? tc("buttons.saving") : tc("buttons.saveChanges")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tc("buttons.cancel")}
        </Button>
      </div>
    </form>
  );
}

// Placeholder hook - should be imported from features/branches/hooks
function useBranch(id: string | null) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        setBranch({
          id: id,
          businessId: "biz-123",
          name: "Sede Principal",
          slug: "sede-principal",
          code: "MAIN001",
          isMainBranch: true,
          isActive: true,
          whatsappPhoneNumber: "+1234567890",
          whatsappPhoneNumberId: "phone-123",
          whatsappNumbersExtra: null,
          routingMode: "SINGLE_NUMBER",
          address: "Av. Principal 123",
          timezone: "America/Santiago",
          currency: "CLP",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

  return { data: branch, isLoading };
}

// Placeholder hook - should be imported from features/branches/hooks
function useUpdateBranch() {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (
    { id, data }: { id: string; data: UpdateBranchRequest },
    options?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => {
    setIsPending(true);
    try {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}

interface EditBranchPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default function EditBranchPage({ params }: EditBranchPageProps) {
  const t = useTranslations("branches");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  // Usar React.use() para unwrap el Promise de params (Next.js 15)
  const { id } = React.use(params);

  const { data: branch, isLoading: isLoadingBranch } = useBranch(id);
  const updateBranch = useUpdateBranch();

  const handleSubmit = (data: UpdateBranchRequest) => {
    updateBranch.mutate(
      { id, data },
      {
        onSuccess: () => {
          router.push("/dashboard/branches");
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/dashboard/branches");
  };

  // Check access for non-super-admin users without business
  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
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

  // Loading state
  if (isLoadingBranch) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!branch) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("notFound.description")}
          </p>
          <Button onClick={() => router.push("/dashboard/branches")}>
            {tc("buttons.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {t("edit.title")}
              </h1>
              <Badge
                variant={branch.isActive ? "default" : "secondary"}
                className={cn(
                  branch.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                )}
              >
                {branch.isActive ? tc("status.active") : tc("status.inactive")}
              </Badge>
              {branch.isMainBranch && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  {t("mainBranch")}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 font-mono text-sm">{branch.code}</p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("form.editTitle")}</CardTitle>
            <CardDescription>{t("form.editDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BranchForm
              branch={branch}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={updateBranch.isPending}
            />
          </CardContent>
        </Card>

        {/* Branch Info Card */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t("info.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{tc("fields.created")}:</span>
              <span className="text-slate-700">
                {new Date(branch.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {tc("fields.lastUpdated")}:
              </span>
              <span className="text-slate-700">
                {new Date(branch.updatedAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {(() => {
              const phone = getPrimaryWhatsApp(branch);
              return phone ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="text-slate-700">{phone}</span>
                </div>
              ) : null;
            })()}
            <div className="flex justify-between">
              <span className="text-slate-500">{t("timezone")}:</span>
              <span className="text-slate-700">{branch.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("currency")}:</span>
              <span className="text-slate-700">{branch.currency}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Importar React para usar React.use()
import * as React from "react";
