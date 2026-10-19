"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, MessageCircle } from "lucide-react";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { getUserSession } from "@/features/auth/services/auth.service";
import { DEMO_WHATSAPP_NUMBER } from "@/features/auth/demo.constants";
import { AUTH_SESSION_KEY } from "@/features/orders/hooks/useUserBranches";
import { cn } from "@/lib/utils";

/**
 * Banner fijo del modo demo.
 *
 * Solo se renderiza cuando `user.isDemo`. No es descartable: la sesión
 * demo siempre debe identificarse como tal, con acceso directo a escribir
 * un pedido de prueba por WhatsApp y salida directa a crear cuenta
 * (cierra la sesión demo y lleva a /register).
 */
export function DemoBanner() {
  const t = useTranslations("auth.login.demo.banner");
  const user = useCurrentUser();
  const logout = useLogout({ redirectTo: "/register", silent: true });
  const isDemo = user?.isDemo === true;

  const { data: session } = useQuery({
    queryKey: AUTH_SESSION_KEY,
    queryFn: getUserSession,
    enabled: isDemo,
  });

  if (!isDemo) return null;

  const contact = session?.demoContact ?? null;
  const rawPhone = contact?.phone ?? user?.demoPhone ?? "";
  const formattedPhone = rawPhone
    ? rawPhone.startsWith("+")
      ? rawPhone
      : `+${rawPhone}`
    : "";
  const whatsappUrl = `https://wa.me/${DEMO_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(
    t("verify.message")
  )}`;

  return (
    <div className="w-full bg-slate-900">
      <div
        className={cn(
          "w-full px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap"
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
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={cn(
            "flex-shrink-0 text-xs font-semibold text-slate-900 bg-white px-3 py-1.5 rounded-lg transition-colors",
            "hover:bg-slate-100 disabled:opacity-60"
          )}
        >
          {logout.isPending ? t("leaving") : t("createAccount")}
        </button>
      </div>
      <div className="w-full px-4 pb-2.5 flex items-center justify-center gap-3 flex-wrap">
        <p className="text-sm text-slate-300 text-center">
          <span className="font-medium text-white">{t("verify.text")}</span>{" "}
          {t("verify.instructions", {
            number: DEMO_WHATSAPP_NUMBER,
            phone: formattedPhone,
          })}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors",
            "hover:bg-emerald-500"
          )}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {t("verify.open")}
        </a>
      </div>
    </div>
  );
}
