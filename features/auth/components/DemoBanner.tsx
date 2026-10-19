"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useCurrentUser, useAuthStore } from "@/features/auth/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { cn } from "@/lib/utils";

/**
 * Banner fijo del modo demo.
 *
 * Solo se renderiza cuando `user.isDemo`. No es descartable: la sesión
 * demo siempre debe identificarse como tal, con salida directa a crear
 * cuenta (cierra la sesión demo y lleva a /register).
 */
export function DemoBanner() {
  const t = useTranslations("auth.login.demo.banner");
  const user = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = React.useState(false);

  if (user?.isDemo !== true) return null;

  const handleCreateAccount = async () => {
    setLeaving(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      queryClient.clear();
      useAuthStore.getState().clearAuth();
      useBranchStore.getState().deselectAllBranches();
      router.push("/register");
    }
  };

  return (
    <div
      className={cn(
        "w-full px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap",
        "bg-slate-900"
      )}
    >
      <div className="flex items-center gap-2 text-center sm:text-left">
        <FlaskConical className="w-4 h-4 text-slate-300 shrink-0" />
        <p className="text-sm font-medium text-white">
          {t("text")}
          <span className="font-normal ml-1.5 text-slate-300">
            {t("subtitle")}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleCreateAccount}
        disabled={leaving}
        className={cn(
          "flex-shrink-0 text-xs font-semibold text-slate-900 bg-white px-3 py-1.5 rounded-lg transition-colors",
          "hover:bg-slate-100 disabled:opacity-60"
        )}
      >
        {leaving ? t("leaving") : t("createAccount")}
      </button>
    </div>
  );
}
