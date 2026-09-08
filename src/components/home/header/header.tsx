"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./header.module.css";
import { montserrat } from "./fonts";
import { NavLink } from "./nav-link";
import { LanguageSelector } from "./language-selector";
import { NotificationBell } from "./notification-bell";
import { AccountMenu } from "./account-menu";

export interface HeaderProps {
  isAuthenticated: boolean;
  role: "user" | "admin";
  activeLink?: "about" | "awards" | "kudos";
}

/**
 * mm:2167:9091 (mms_A1_Header) — homepage header. Presentational only:
 * `isAuthenticated`/`role` are resolved by a later integration phase
 * (src/app/page.tsx) and passed down; see clarifications.md.
 */
export function Header({ isAuthenticated, role, activeLink }: HeaderProps) {
  const t = useTranslations("home.header");

  return (
    // mm:2167:9091
    <header className={`${styles.header} ${montserrat.variable}`}>
      {/* mm:I2167:9091;186:2166 */}
      <div className={styles.left}>
        {/* mm:I2167:9091;178:1033 */}
        <Link href="/" className={styles.logo} aria-label={t("logoAlt")}>
          {/* mm:I2167:9091;178:1033;178:1030 */}
          <Image
            src="/home/header/logo.png"
            alt={t("logoAlt")}
            width={52}
            height={48}
            priority
          />
        </Link>
        {/* mm:I2167:9091;178:653 */}
        <nav className={styles.nav}>
          {/* mm:I2167:9091;186:1579 */}
          <NavLink href="/" active={activeLink === "about"}>
            {t("nav.about")}
          </NavLink>
          {/* mm:I2167:9091;186:1587 */}
          <NavLink href="/awards-information" active={activeLink === "awards"}>
            {t("nav.awards")}
          </NavLink>
          {/* mm:I2167:9091;186:1593 */}
          <NavLink href="/sun-kudos" active={activeLink === "kudos"}>
            {t("nav.kudos")}
          </NavLink>
        </nav>
      </div>
      {/* mm:I2167:9091;186:1601 */}
      <div className={styles.right}>
        {isAuthenticated ? <NotificationBell /> : null}
        <LanguageSelector />
        {isAuthenticated ? <AccountMenu role={role} /> : null}
      </div>
    </header>
  );
}
