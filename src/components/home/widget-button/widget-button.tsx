"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./widget-button.module.css";
import { montserrat } from "./fonts";
import { IconPen } from "./icons/icon-pen";
import { IconSaa } from "./icons/icon-saa";

/**
 * Floating quick-action widget (Figma spec item 6, instance
 * mms_6_Widget Button node 5022:15169). Self-contained open/close state —
 * same click-outside-to-close pattern as
 * src/components/login/language-selector.tsx. Per clarifications.md, the
 * menu is a placeholder shell ("Coming soon") — no real actions defined yet.
 */
export function WidgetButton() {
  const t = useTranslations("home.widget");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    // mm:5022:15169
    <div
      ref={containerRef}
      className={`${styles.widget} ${montserrat.variable}`}
    >
      {/* mm:I5022:15169;214:3839 */}
      <button
        type="button"
        data-testid="widget-button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {/* mm:I5022:15169;214:3839;186:1935 */}
        <span className={styles.iconGroup}>
          {/* mm:I5022:15169;214:3839;186:1763 */}
          <IconPen className={styles.penIcon} />
          {/* mm:I5022:15169;214:3839;186:1568 */}
          <span className={styles.separator}>/</span>
        </span>
        {/* mm:I5022:15169;214:3839;186:1766 */}
        <span className={styles.saaIconWrap}>
          {/* mm:I5022:15169;214:3839;186:1766;214:3762 */}
          <IconSaa className={styles.saaIcon} />
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          data-testid="widget-menu"
          className={styles.menu}
        >
          <p className={styles.menuPlaceholder}>{t("menuPlaceholder")}</p>
        </div>
      ) : null}
    </div>
  );
}
