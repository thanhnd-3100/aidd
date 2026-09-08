"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./footer.module.css";
import { montserrat, montserratAlternates } from "./fonts";
import { FooterNavLink } from "./footer-nav-link";

/**
 * mm:5001:14800 (mms_7_Footer) — homepage footer. Presentational only, same
 * 3 nav links as the header (item 7.1-7.4 per phase-a1's integration
 * contract).
 */
export function Footer() {
  const t = useTranslations("home.footer");

  function scrollToTop(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    // mm:5001:14800
    <footer className={`${styles.footer} ${montserrat.variable} ${montserratAlternates.variable}`}>
      {/* mm:I5001:14800;342:1407 */}
      <div className={styles.left}>
        {/* mm:I5001:14800;342:1408 */}
        <Link href="/" className={styles.logo} aria-label={t("logoAlt")} onClick={scrollToTop}>
          {/* mm:I5001:14800;342:1408;178:1030 */}
          <Image
            src="/home/footer/logo.png"
            alt={t("logoAlt")}
            width={69}
            height={64}
            priority
          />
        </Link>
        {/* mm:I5001:14800;342:1409 */}
        <nav className={styles.nav}>
          {/* mm:I5001:14800;342:1410 */}
          <FooterNavLink href="/">{t("nav.about")}</FooterNavLink>
          {/* mm:I5001:14800;342:1411 */}
          <FooterNavLink href="/awards-information">{t("nav.awards")}</FooterNavLink>
          {/* mm:I5001:14800;342:1412 */}
          <FooterNavLink href="/sun-kudos">{t("nav.kudos")}</FooterNavLink>
        </nav>
      </div>
      {/* mm:I5001:14800;342:1413 */}
      <p className={styles.copyright}>{t("copyright")}</p>
    </footer>
  );
}
