"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./login-header.module.css";
import { LanguageSelector } from "./language-selector";

export function LoginHeader() {
  const t = useTranslations("login.header");

  return (
    // mm:662:14391
    <header className={styles.header}>
      {/* mm:I662:14391;186:2166 */}
      <div className={styles.logo}>
        {/* mm:I662:14391;178:1033;178:1030 */}
        <Image
          src="/login/logo-saa.png"
          alt={t("logoAlt")}
          width={52}
          height={48}
          priority
        />
      </div>
      <LanguageSelector />
    </header>
  );
}
