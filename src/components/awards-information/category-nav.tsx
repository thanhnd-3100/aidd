"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./category-nav.module.css";
import { AWARD_CATEGORIES } from "./award-categories";

/**
 * mm:313:8459 (mms_C_Menu list) — left-side sticky category navigation.
 * Self-contained client component state (matching the open/close pattern of
 * src/components/login/language-selector.tsx and
 * src/components/home/widget-button/widget-button.tsx): clicking an item
 * scrolls the matching `#slug` section into view and sets that item's
 * active state (gold text + underline); clicking a different item clears
 * the previous active state. Scroll-spy is not built — see
 * plans/260908-1118-award-information-screen/clarifications.md.
 */
export function CategoryNav() {
  const t = useTranslations("awards-information.nav");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  function handleClick(slug: string) {
    setActiveSlug(slug);
    const target = document.getElementById(slug);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    // mm:313:8459
    <nav className={styles.menuList} aria-label={t("ariaLabel")}>
      {AWARD_CATEGORIES.map((category) => {
        const isActive = category.slug === activeSlug;
        return (
          // mm:313:8460-313:8465
          <button
            key={category.slug}
            type="button"
            className={isActive ? `${styles.item} ${styles.itemActive}` : styles.item}
            aria-current={isActive}
            onClick={() => handleClick(category.slug)}
          >
            <Image
              src="/awards-information/icon-target.svg"
              alt=""
              width={24}
              height={24}
              className={styles.icon}
            />
            <span>{t(category.messageKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
