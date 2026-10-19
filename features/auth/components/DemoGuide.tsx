"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, MessageCircle } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { getUserSession } from "@/features/auth/services/auth.service";
import { DEMO_WHATSAPP_NUMBER } from "@/features/auth/demo.constants";
import {
  DEMO_GUIDE_STEPS,
  useDemoGuideStore,
  type DemoGuideStep,
} from "@/features/auth/stores/demo-guide.store";
import { AUTH_SESSION_KEY } from "@/features/orders/hooks/useUserBranches";
import { cn } from "@/lib/utils";

/**
 * Guía flotante del modo demo (abajo a la derecha, minimizable).
 *
 * Tres pasos: pedir por WhatsApp a Togo desde el número registrado, verlo
 * llegar a Pedidos y cambiarle el estado. Al terminar invita a crear cuenta.
 * El progreso lo marcan el clic en WhatsApp, el socket de pedido creado y
 * la mutación de cambio de estado (ver demo-guide.store).
 */
export function DemoGuide() {
  const t = useTranslations("auth.login.demo.guide");
  const tb = useTranslations("auth.login.demo.banner");
  const pathname = usePathname();
  const user = useCurrentUser();
  const isDemo = user?.isDemo === true;
  const logout = useLogout({ redirectTo: "/register", silent: true });

  const done = useDemoGuideStore((s) => (user ? s.progress[user.userId] : undefined));
  const minimized = useDemoGuideStore((s) => s.minimized);
  const setMinimized = useDemoGuideStore((s) => s.setMinimized);
  const complete = useDemoGuideStore((s) => s.complete);

  const { data: session } = useQuery({
    queryKey: AUTH_SESSION_KEY,
    queryFn: getUserSession,
    enabled: isDemo,
  });

  if (!isDemo || !user) return null;

  const completed = done ?? [];
  const isDone = (step: DemoGuideStep) => completed.includes(step);
  const current = DEMO_GUIDE_STEPS.find((step) => !isDone(step));
  const doneCount = DEMO_GUIDE_STEPS.filter(isDone).length;
  const isOnOrdersPage = pathname.startsWith("/dashboard/orders");

  const rawPhone = session?.demoContact?.phone ?? user.demoPhone ?? "";
  const phone = rawPhone && !rawPhone.startsWith("+") ? `+${rawPhone}` : rawPhone;
  const whatsappUrl = `https://wa.me/${DEMO_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(
    t("message")
  )}`;

  const position = "fixed z-40 right-4 bottom-24 md:right-6 md:bottom-6";

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className={cn(
          position,
          "inline-flex items-center gap-2.5 h-12 pl-2 pr-4 rounded-full glass-strong border border-white shadow-card-lg text-sm font-semibold text-slate-900"
        )}
      >
        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
          {doneCount}/{DEMO_GUIDE_STEPS.length}
        </span>
        {t("pill")}
      </button>
    );
  }

  const minimizeButton = (dark?: boolean) => (
    <button
      type="button"
      onClick={() => setMinimized(true)}
      aria-label={t("minimize")}
      className={cn(
        "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors",
        dark
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      <ChevronDown className="w-4 h-4" />
    </button>
  );

  const steps: { id: DemoGuideStep; label: string; body?: ReactNode }[] = [
    {
      id: "whatsapp",
      label: t("steps.whatsapp"),
      body: (
        <>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => complete(user.userId, "whatsapp")}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-500 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {t("steps.whatsappCta")}
          </a>
          {phone && (
            <span className="text-xs text-slate-500 text-center">
              {t("steps.whatsappFrom", { phone })}
            </span>
          )}
        </>
      ),
    },
    {
      id: "arrived",
      label: t("steps.arrived"),
      body: (
        <>
          <span className="text-[13px] text-slate-600">{t("steps.arrivedHint")}</span>
          <button
            type="button"
            onClick={() => complete(user.userId, "arrived")}
            className="h-10 rounded-xl bg-white border border-indigo-200 text-[13.5px] font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            {t("steps.arrivedCta")}
          </button>
        </>
      ),
    },
    {
      id: "status",
      label: t("steps.status"),
      body: (
        <>
          <span className="text-[13px] text-slate-600">{t("steps.statusHint")}</span>
          {isOnOrdersPage ? (
            <button
              type="button"
              onClick={() => {
                complete(user.userId, "status");
                window.setTimeout(() => setMinimized(true), 400);
              }}
              className="h-10 rounded-xl bg-white border border-indigo-200 text-[13.5px] font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              {t("steps.statusConfirmCta")}
            </button>
          ) : (
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center justify-center h-10 rounded-xl bg-white border border-indigo-200 text-[13.5px] font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              {t("steps.statusCta")}
            </Link>
          )}
        </>
      ),
    },
  ];

  return (
    <aside
      aria-label={t("pill")}
      className={cn(
        position,
        "w-[340px] max-w-[calc(100vw-2rem)] rounded-3xl p-[18px] flex flex-col gap-3.5",
        "glass-strong border border-white shadow-card-lg"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold tracking-tight text-slate-900">
            {current ? t("title") : t("doneTitle")}
          </p>
          <div className="mt-1.5 flex gap-1" aria-hidden="true">
            {DEMO_GUIDE_STEPS.map((step) => (
              <span
                key={step}
                className={cn(
                  "w-9 h-1 rounded-full",
                  isDone(step) || step === current ? "bg-indigo-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>
        {minimizeButton()}
      </div>

      <ol className="flex flex-col gap-2.5 text-sm">
        {steps.map((step, index) => {
          if (step.id === current) {
            return (
              <li key={step.id} className="rounded-2xl bg-indigo-50 p-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-slate-900">{step.label}</span>
                </div>
                {step.body}
              </li>
            );
          }
          const stepDone = isDone(step.id);
          return (
            <li
              key={step.id}
              className={cn(
                "px-3 py-1 flex items-center gap-2.5",
                stepDone ? "text-slate-400" : "text-slate-500"
              )}
            >
              {stepDone ? (
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
              ) : (
                <span className="w-6 h-6 rounded-full border-[1.5px] border-slate-300 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              )}
              <span className={cn(stepDone && "line-through")}>{step.label}</span>
            </li>
          );
        })}
      </ol>

      {!current && (
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {logout.isPending ? tb("leaving") : tb("createAccount")}
          </button>
          <span className="text-center text-xs text-slate-500">{tb("trialNote")}</span>
        </div>
      )}
    </aside>
  );
}
