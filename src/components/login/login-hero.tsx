"use client";

import { useTranslations } from "next-intl";
import styles from "./login-hero.module.css";
import { IconGoogle } from "./icons/icon-google";

export interface LoginHeroProps {
  onLoginClick: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function LoginHero({ onLoginClick, isLoading, errorMessage }: LoginHeroProps) {
  const t = useTranslations("login.hero");

  return (
    // mm:662:14393
    <section className={styles.hero}>
      {/* mm:662:14395 — abstract wave key-visual art has no MM_MEDIA asset
          (get_media_files returned no URL for node "image 1" 662:14389),
          approximated with the Figma-specified overlay gradients */}
      <div className={styles.keyVisual} aria-hidden="true" />

      {/* mm:662:14755 */}
      <div className={styles.content}>
        {/* mm:2939:9548 — Figma models this as a static image asset with no
            TEXT style; rendered as real, localizable, testable text instead
            (see integration contract + report concerns) */}
        <h1 className={styles.title}>{t("title")}</h1>

        {/* mm:662:14753 */}
        <p className={styles.description}>{t("subtitle")}</p>
        <p className={styles.description}>{t("tagline")}</p>

        {/* mm:662:14425 */}
        <div className={styles.loginArea}>
          {/* mm:662:14426 */}
          <button
            type="button"
            className={styles.loginButton}
            onClick={onLoginClick}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {/* mm:I662:14426;186:1766 */}
            <IconGoogle className={styles.googleIcon} />
            {/* mm:I662:14426;186:1568 */}
            <span>{isLoading ? t("loadingButton") : t("loginButton")}</span>
          </button>
          {errorMessage ? (
            <p role="alert" className={styles.errorMessage}>
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
