"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, MessageCircle, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { getUserSession } from "@/features/auth/services/auth.service";
import { DEMO_WHATSAPP_NUMBER } from "@/features/auth/demo.constants";
import { AUTH_SESSION_KEY } from "@/features/orders/hooks/useUserBranches";
import { CONVERSATIONS_KEYS } from "@/features/conversations/hooks/query-keys";
import { cn } from "@/lib/utils";

/** Mientras el número no esté verificado, se consulta la sesión cada 5 s. */
const VERIFICATION_POLL_MS = 5000;

/**
 * Banner fijo del modo demo.
 *
 * Solo se renderiza cuando `user.isDemo`. No es descartable: la sesión
 * demo siempre debe identificarse como tal, con salida directa a crear
 * cuenta (cierra la sesión demo y lleva a /register).
 *
 * Mientras el número no esté verificado muestra el código que el visitante
 * debe enviar por WhatsApp a la demo (el backend no le abre conversaciones
 * ni pedidos hasta recibirlo) y consulta la sesión hasta que se verifique;
 * entonces recarga el inbox.
 */
export function DemoBanner() {
  const t = useTranslations("auth.login.demo.banner");
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const logout = useLogout({ redirectTo: "/register", silent: true });
  const isDemo = user?.isDemo === true;

  const { data: session } = useQuery({
    queryKey: AUTH_SESSION_KEY,
    queryFn: getUserSession,
    enabled: isDemo,
    refetchInterval: (query) =>
      query.state.data?.demoContact?.verified === false
        ? VERIFICATION_POLL_MS
        : false,
  });

  const contact = session?.demoContact ?? null;
  const verified = contact?.verified === true;
  const code = contact?.verificationCode ?? user?.demoVerificationCode ?? null;

  const wasVerified = React.useRef(verified);
  React.useEffect(() => {
    if (verified && !wasVerified.current) {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEYS.all });
    }
    wasVerified.current = verified;
  }, [verified, queryClient]);

  if (!isDemo) return null;

  const pendingCode = !verified && code ? code : null;
  const rawPhone = contact?.phone ?? user?.demoPhone ?? "";
  const formattedPhone = rawPhone
    ? rawPhone.startsWith("+")
      ? rawPhone
      : `+${rawPhone}`
    : "";
  const whatsappUrl = pendingCode
    ? `https://wa.me/${DEMO_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(
        t("verify.message", { code: pendingCode })
      )}`
    : null;

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
      {pendingCode && whatsappUrl && (
        <div className="w-full px-4 pb-2.5 flex items-center justify-center gap-3 flex-wrap">
          <p className="text-sm text-slate-300 text-center">
            <span className="font-medium text-white">{t("verify.text")}</span>{" "}
            {t.rich("verify.instructions", {
              code: pendingCode,
              hl: (chunks) => (
                <span className="font-mono font-semibold tracking-wider text-white bg-slate-700 px-1.5 py-0.5 rounded">
                  {chunks}
                </span>
              ),
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
      )}
      {verified && (
        <div className="w-full px-4 pb-2 flex items-center justify-center gap-1.5 text-xs text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("verify.verified")}
        </div>
      )}
    </div>
  );
}
