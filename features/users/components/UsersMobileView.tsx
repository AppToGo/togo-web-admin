"use client";

/**
 * Usuarios en el teléfono (< md), según el diseño móvil: uso del plan,
 * filtro por rol con su contador y filas con avatar, rol y contacto. Tocar
 * una abre el detalle (editar, desactivar); el botón flotante crea uno.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Crown } from "lucide-react";
import { Link } from "@/i18n/routing";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { MobileFab } from "@/components/ui/mobile-fab";
import { PillGroup } from "@/components/ui/pill-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { User } from "../types";

type RoleFilter = "all" | "OWNER" | "ADMIN" | "OPERATOR";

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-violet-100 text-violet-800",
  ADMIN: "bg-blue-100 text-blue-800",
  OPERATOR: "bg-slate-200 text-slate-700",
};

interface UsersMobileViewProps {
  users: User[] | undefined;
  isLoading: boolean;
  /** "3 / 5 usuarios activos · Plan Pro", ya formateado por la página. */
  limitText: string;
  isLimitReached: boolean;
  onUpgrade: () => void;
  onCreate: () => void;
}

export function UsersMobileView({
  users,
  isLoading,
  limitText,
  isLimitReached,
  onUpgrade,
  onCreate,
}: UsersMobileViewProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const [role, setRole] = useState<RoleFilter>("all");

  const list = useMemo(() => users ?? [], [users]);
  const visible = role === "all" ? list : list.filter((user) => user.role === role);
  const count = (id: RoleFilter) =>
    id === "all" ? list.length : list.filter((user) => user.role === id).length;

  return (
    <div className="-mx-4 -mt-4 flex flex-col sm:-mx-6 sm:-mt-6" data-testid="users-mobile-view">
      <div className="flex flex-col gap-2.5 border-b border-slate-200/70 bg-white px-4 pb-3 pt-1 sm:px-6">
        <span
          className={cn("flex items-center gap-2 text-xs", isLimitReached ? "text-amber-700" : "text-slate-500")}
        >
          {limitText}
          {isLimitReached && (
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex items-center gap-1 font-semibold text-amber-700"
            >
              <Crown className="h-3 w-3" />
              {t("limits.upgradeCta")}
            </button>
          )}
        </span>
        <PillGroup
          label={t("mobile.roleFilter")}
          value={role}
          onChange={setRole}
          className="-mx-4 px-4 sm:-mx-6 sm:px-6"
          options={[
            { id: "all", label: t("mobile.roles.all"), count: count("all") },
            { id: "OWNER", label: t("roles.OWNER"), count: count("OWNER") },
            { id: "ADMIN", label: t("roles.ADMIN"), count: count("ADMIN") },
            { id: "OPERATOR", label: t("mobile.roles.operators"), count: count("OPERATOR") },
          ]}
        />
      </div>

      <div className="p-3 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-center text-[15px] text-slate-500">{t("empty.title")}</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white">
            {visible.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className={cn(
                    "flex min-h-16 items-center gap-3 px-3.5 py-2.5",
                    !user.active && "opacity-55"
                  )}
                >
                  <InitialsAvatar name={user.name} seed={user.id} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-slate-900">
                        {user.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                          ROLE_BADGE[user.role] ?? ROLE_BADGE.OPERATOR
                        )}
                      >
                        {t(`roles.${user.role}`)}
                      </span>
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {[user.email ?? user.phoneNumber, !user.active && tc("status.inactive")]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div aria-hidden className="h-16" />
      </div>

      <MobileFab label={t("mobile.newUser")} onClick={isLimitReached ? onUpgrade : onCreate} />
    </div>
  );
}
