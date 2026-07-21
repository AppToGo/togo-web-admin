"use client";

/**
 * Meta Embedded Signup Hook
 *
 * Encapsula la carga del Facebook JS SDK y el flujo de FB.login con
 * config_id (Embedded Signup) para conectar una WABA propia del comercio.
 *
 * Dos piezas de información llegan por canales distintos y deben combinarse:
 * - `code`: viene del callback de FB.login (authResponse.code).
 * - `waba_id` / `phone_number_id`: llegan via window.postMessage con
 *   type === "WA_EMBEDDED_SIGNUP", emitido por el propio flujo de Meta.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { APP_CONFIG } from "@/config/app.config";

declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        params: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface FacebookLoginResponse {
  authResponse?: {
    code?: string;
  };
  status?: string;
}

export interface EmbeddedSignupResult {
  code: string;
  wabaId: string;
  phoneNumberId: string;
}

const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";
const SDK_SCRIPT_ID = "facebook-jssdk";
const SESSION_INFO_TIMEOUT_MS = 8000;
const SESSION_INFO_POLL_MS = 200;

let sdkLoadPromise: Promise<void> | null = null;

function loadFacebookSdk(appId: string, version: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("El SDK de Facebook solo puede cargarse en el navegador")
    );
  }
  if (window.FB) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        xfbml: false,
        version,
      });
      resolve();
    };

    if (document.getElementById(SDK_SCRIPT_ID)) {
      // El script ya fue insertado (ej. remount) — solo esperamos fbAsyncInit
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("No se pudo cargar el SDK de Facebook"));
    };
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

export function useMetaEmbeddedSignup() {
  const t = useTranslations("whatsapp");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `generation` correlaciona el postMessage con el intento de launch() que lo
  // espera: sin esto, un mensaje que llega tarde de un intento cancelado
  // podría combinarse con el `code` de un intento posterior distinto.
  const generationRef = useRef(0);
  const sessionInfoRef = useRef<{
    wabaId?: string;
    phoneNumberId?: string;
    generation?: number;
  }>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.event === "FINISH") {
          sessionInfoRef.current = {
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
            generation: generationRef.current,
          };
        }
      } catch {
        // Ignorar mensajes no-JSON (Facebook envía otros formatos de mensaje)
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const waitForSessionInfo = useCallback(
    (code: string, generation: number): Promise<EmbeddedSignupResult> => {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const poll = () => {
          const {
            wabaId,
            phoneNumberId,
            generation: msgGeneration,
          } = sessionInfoRef.current;
          if (wabaId && phoneNumberId && msgGeneration === generation) {
            resolve({ code, wabaId, phoneNumberId });
            return;
          }
          if (Date.now() - start > SESSION_INFO_TIMEOUT_MS) {
            reject(new Error(t("accounts.embedded.errors.noSessionInfo")));
            return;
          }
          setTimeout(poll, SESSION_INFO_POLL_MS);
        };
        poll();
      });
    },
    [t]
  );

  const launch = useCallback((): Promise<EmbeddedSignupResult> => {
    setError(null);
    setIsLoading(true);
    const myGeneration = ++generationRef.current;
    sessionInfoRef.current = {};

    const { appId, configId, graphVersion } = APP_CONFIG.meta;

    const run = async (): Promise<EmbeddedSignupResult> => {
      if (!appId || !configId) {
        throw new Error(t("accounts.embedded.errors.notConfigured"));
      }

      await loadFacebookSdk(appId, graphVersion);

      if (!window.FB) {
        throw new Error(t("accounts.embedded.errors.sdkUnavailable"));
      }

      const code = await new Promise<string>((resolve, reject) => {
        window.FB!.login(
          (response) => {
            const authCode = response.authResponse?.code;
            if (!authCode) {
              reject(new Error(t("accounts.embedded.errors.loginCancelled")));
              return;
            }
            resolve(authCode);
          },
          {
            config_id: configId,
            response_type: "code",
            override_default_response_type: true,
            extras: {
              setup: {},
              featureType: "",
              sessionInfoVersion: "3",
            },
          }
        );
      });

      return waitForSessionInfo(code, myGeneration);
    };

    return run()
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : t("accounts.embedded.errors.generic");
        setError(message);
        throw err;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [t, waitForSessionInfo]);

  return { launch, isLoading, error };
}
