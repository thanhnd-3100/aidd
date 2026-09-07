"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { LoginScreen } from "./login-screen";
import { signInWithGoogle } from "@/lib/auth/login-actions";
import type { OAuthErrorCode } from "@/lib/auth/oauth-messages";

export interface LoginScreenContainerProps {
  oauthErrorCode?: OAuthErrorCode | null;
}

/**
 * Client wrapper around the presentational `LoginScreen`. Owns the bits that
 * only make sense in the browser: the `isLoading` transition and the
 * `window.location.origin` that `signInWithGoogle` needs to build its OAuth
 * redirect URL. The server-resolved `oauthErrorCode` (from the callback
 * route's `?error=` query param) is translated here via `useTranslations` so
 * the displayed message always matches the active locale.
 */
export function LoginScreenContainer({ oauthErrorCode }: LoginScreenContainerProps) {
  const t = useTranslations("login.hero");
  const [isLoading, setIsLoading] = useState(false);
  const [hasClientError, setHasClientError] = useState(false);

  const handleLoginClick = useCallback(() => {
    setIsLoading(true);
    setHasClientError(false);

    signInWithGoogle(window.location.origin)
      .then(({ error }) => {
        if (error) {
          setHasClientError(true);
          setIsLoading(false);
        }
        // On success, Supabase navigates the browser away to Google's OAuth
        // consent screen, so isLoading intentionally stays true until then.
      })
      .catch(() => {
        setHasClientError(true);
        setIsLoading(false);
      });
  }, []);

  const errorMessage = hasClientError || oauthErrorCode ? t("errorMessage") : null;

  return (
    <LoginScreen
      onLoginClick={handleLoginClick}
      isLoading={isLoading}
      errorMessage={errorMessage}
    />
  );
}
