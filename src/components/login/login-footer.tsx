"use client";

import { useTranslations } from "next-intl";
import styles from "./login-footer.module.css";

export function LoginFooter() {
  const t = useTranslations("login.footer");

  return (
    // mm:662:14447
    <footer className={styles.footer}>
      {/* mm:I662:14447;342:1413 */}
      <p className={styles.copyright}>{t("copyright")}</p>
    </footer>
  );
}
