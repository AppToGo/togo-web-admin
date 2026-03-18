"use client";

import { useEffect } from "react";
import { Store, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useIsSuperAdmin, useCurrentUser } from "@/features/auth/stores/auth.store";
import { useBusinesses } from "@/features/orders/hooks/useOrders";
import {
  useBusinessStore,
  useEffectiveBusinessId,
} from "@/features/business/stores/business.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Business } from "@/types";

export function BusinessSelector() {
  const t = useTranslations();
  const isSuperAdmin = useIsSuperAdmin();
  const user = useCurrentUser();
  const { data: businesses, isLoading } = useBusinesses();
  const { selectedBusinessId, selectedBusinessName, setSelectedBusiness } =
    useBusinessStore();
  const effectiveBusinessId = useEffectiveBusinessId();

  // Para usuarios normales, usar su businessId
  useEffect(() => {
    if (!isSuperAdmin && user?.businessId && !selectedBusinessId) {
      setSelectedBusiness(user.businessId, user.businessName || undefined);
    }
  }, [isSuperAdmin, user, selectedBusinessId, setSelectedBusiness]);

  // Solo mostrar para SUPER_ADMIN
  if (!isSuperAdmin) {
    return null;
  }

  // Encontrar el negocio seleccionado para mostrar su nombre
  const selectedBusiness = businesses?.find(
    (b: Business) => b.id === selectedBusinessId
  );

  const displayName =
    selectedBusinessId === ""
      ? t("business.allBusinesses")
      : selectedBusiness?.name ||
        selectedBusinessName ||
        t("business.selectBusiness");

  return (
    <div className="px-3 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-card",
              "bg-white/60 hover:bg-white/80",
              "border border-white/40",
              "transition-all duration-200",
              "text-left"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">{t("business.business")}</p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {isLoading ? t("common.status.loading") : displayName}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {/* Opción "Todos los negocios" */}
          <DropdownMenuItem
            onClick={() => setSelectedBusiness("", t("business.allBusinesses"))}
            className={cn(
              "cursor-pointer",
              effectiveBusinessId === "" && "bg-indigo-50 text-indigo-700"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2">
              <span className="text-xs font-bold text-slate-600">*</span>
            </div>
            <span className="font-medium">{t("business.allBusinesses")}</span>
          </DropdownMenuItem>

          {/* Separador */}
          <div className="h-px bg-slate-100 my-1" />

          {/* Lista de negocios */}
          {isLoading ? (
            <DropdownMenuItem disabled className="text-slate-400">
              {t("business.loadingBusinesses")}
            </DropdownMenuItem>
          ) : businesses?.length === 0 ? (
            <DropdownMenuItem disabled className="text-slate-400">
              {t("business.noBusinessesAvailable")}
            </DropdownMenuItem>
          ) : (
            businesses?.map((business: Business) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => setSelectedBusiness(business.id, business.name)}
                className={cn(
                  "cursor-pointer",
                  effectiveBusinessId === business.id &&
                    "bg-indigo-50 text-indigo-700"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    business.isActive ? "bg-emerald-400" : "bg-slate-300"
                  )}
                />
                <span className="truncate">{business.name}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
