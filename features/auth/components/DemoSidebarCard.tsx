"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { useTrialDays } from "@/features/subscription/hooks/usePlanCatalog";
import { cn } from "@/lib/utils";

interface DemoSidebarCardProps {
  isCollapsed: boolean;
}

/**
 * Invitación a crear cuenta, al pie del menú lateral durante la sesión demo.
 *
 * Reemplaza al banner superior: identifica la sesión como demo sin quitarle
 * alto al tablero. "Crear mi cuenta" cierra la sesión demo y lleva a
 * /register. Colapsado, queda solo el ícono.
 */
export function DemoSidebarCard({ isCollapsed }: DemoSidebarCardProps) {
  const t = useTranslations("auth.login.demo.banner");
  const user = useCurrentUser();
  const isDemo = user?.isDemo === true;
  const trialDays = useTrialDays(isDemo);
  const logout = useLogout({ redirectTo: "/register", silent: true });

  if (!isDemo) return null;

  if (isCollapsed) {
    return (
      <div className="shrink-0 px-2 pb-2">
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          title={t("createAccount")}
          aria-label={t("createAccount")}
          className="w-full h-11 rounded-card bg-gradient-to-br from-indigo-900 via-indigo-600 to-violet-600 text-white flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-3 pb-3">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-900 via-indigo-600 to-violet-600 text-white flex flex-col gap-2.5 shadow-card">
        <span className="self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
          {t("badge")}
        </span>
        <p className="text-[15px] font-bold leading-snug">{t("title")}</p>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={cn(
            "h-11 rounded-xl bg-white text-sm font-semibold text-indigo-900 transition-colors cursor-pointer",
            "hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {logout.isPending ? t("leaving") : t("createAccount")}
        </button>
        {trialDays !== null && (
          <span className="text-center text-xs text-indigo-100">
            {t("trialNote", { days: trialDays })}
          </span>
        )}
      </div>
    </div>
  );
}
