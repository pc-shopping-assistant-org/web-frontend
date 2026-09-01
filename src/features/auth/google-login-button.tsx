"use client";

import Script from "next/script";
import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useCallback, useEffect, useRef, useState} from "react";

import {ErrorMessage} from "@/components/ui/error-message";
import {ApiMessageKey} from "@/lib/domain/message-keys";

import {loginWithGoogle} from "./api";
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

export function GoogleLoginButton({redirectTo}: {redirectTo?: string} = {}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pendingRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential || pendingRef.current) return;
    setError(null);
    pendingRef.current = true;
    setPending(true);
    try {
      const request: GoogleLoginRequest = {idToken: response.credential};
      await loginWithGoogle(request);
      router.push(redirectTo?.startsWith("/") ? redirectTo : "/account");
      router.refresh();
    } catch (cause) {
      setError(cause);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [redirectTo, router]);

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
      width: 384,
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
    <div ref={containerRef} className={pending ? "pointer-events-none opacity-60" : undefined} aria-busy={pending} />
    {error ? <ErrorMessage error={error} fallback={ApiMessageKey.SERVICE_UNAVAILABLE} /> : null}
  </div>;
}
