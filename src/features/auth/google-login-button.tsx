"use client";

import Script from "next/script";
import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useCallback, useEffect, useRef, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";

import {ErrorMessage} from "@/components/ui/error-message";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {cn} from "@/lib/utils";
import {apiFetch} from "@/lib/api/client";
import {PUBLIC_CONFIG_PATH, publicConfigKeys, publicConfigSchema} from "@/lib/config/public-config";

import {loginWithGoogle} from "./api";
import {resyncIdentityCaches} from "@/features/auth/queries";
import type {GoogleLoginRequest} from "@/features/auth/contracts/requests";

type GoogleCredentialResponse = {credential: string};
type GoogleButtonOptions = {
  type: "standard";
  theme: "outline";
  size: "large";
  width: number;
  text: "signin_with";
  shape: "rectangular";
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize(configuration: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode: "popup";
        auto_select: false;
      }): void;
      renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
// Google draws the button at a fixed pixel width within these limits, so it is sized to the space it is given;
// the login form is held to the same maximum so the button spans it exactly
const GOOGLE_BUTTON_MIN_WIDTH = 200;
const GOOGLE_BUTTON_MAX_WIDTH = 400;

export function GoogleLoginButton({redirectTo, onSuccess}: {redirectTo?: string; onSuccess?: () => void} = {}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pendingRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const {data: publicConfig} = useQuery({
    queryKey: publicConfigKeys.all,
    queryFn: async () => publicConfigSchema.parse(await apiFetch(PUBLIC_CONFIG_PATH, {cache: "no-store"})),
    retry: false,
  });
  const clientId = publicConfig?.googleClientId;

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential || pendingRef.current) return;
    setError(null);
    pendingRef.current = true;
    setPending(true);
    try {
      const request: GoogleLoginRequest = {idToken: response.credential};
      await loginWithGoogle(request);
      await resyncIdentityCaches(queryClient);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo?.startsWith("/") ? redirectTo : "/account");
        router.refresh();
      }
    } catch (cause) {
      setError(cause);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [redirectTo, onSuccess, router, queryClient]);

  const renderButton = useCallback(() => {
    if (!clientId || !scriptReady || !window.google || !containerRef.current || initializedRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => void handleCredential(response),
      ux_mode: "popup",
      auto_select: false,
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: Math.min(GOOGLE_BUTTON_MAX_WIDTH, Math.max(GOOGLE_BUTTON_MIN_WIDTH, Math.floor(containerRef.current.clientWidth))),
      text: "signin_with",
      shape: "rectangular",
    });
    initializedRef.current = true;
  }, [clientId, handleCredential, scriptReady]);

  useEffect(() => {
    renderButton();
  }, [renderButton]);

  if (!clientId) return null;

  return <div className="space-y-4">
    <Script src={GOOGLE_SCRIPT} strategy="afterInteractive" onLoad={() => setScriptReady(true)} onReady={() => setScriptReady(true)} onError={() => setError(new Error(ApiMessageKey.SERVICE_UNAVAILABLE))} />
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>{t("orContinueWith")}</span><span className="h-px flex-1 bg-border" /></div>
    <div ref={containerRef} className={cn("flex justify-center", pending && "pointer-events-none opacity-60")} aria-busy={pending} />
    {error ? <ErrorMessage error={error} fallback={ApiMessageKey.SERVICE_UNAVAILABLE} /> : null}
  </div>;
}
