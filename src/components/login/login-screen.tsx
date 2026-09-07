"use client";

import styles from "./login-screen.module.css";
import { montserrat, montserratAlternates } from "./fonts";
import { LoginHeader } from "./login-header";
import { LoginHero } from "./login-hero";
import { LoginFooter } from "./login-footer";

export interface LoginScreenProps {
  onLoginClick: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

/**
 * mm:662:14387 — composes the Login screen sections. Presentational only:
 * the OAuth call, session check, and redirect guard are wired by the
 * integration phase via the props below.
 */
export function LoginScreen({ onLoginClick, isLoading, errorMessage }: LoginScreenProps) {
  return (
    <div className={`${styles.screen} ${montserrat.variable} ${montserratAlternates.variable}`}>
      <LoginHeader />
      <LoginHero
        onLoginClick={onLoginClick}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
      <LoginFooter />
    </div>
  );
}
