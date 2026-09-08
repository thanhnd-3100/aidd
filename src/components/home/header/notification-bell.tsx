"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./notification-bell.module.css";
import { IconNotification } from "./icons/icon-notification";

/**
 * mm:I2167:9091;186:2101 (A1.6) — notification bell + placeholder panel.
 * Per clarifications.md: visual-only stub, no backend; the unread badge is
 * always hidden (no unread-count logic), so it is not rendered at all.
 */
export function NotificationBell() {
  const t = useTranslations("home.header.notification");
  const [open, setOpen] = useState(false);
  const panelId = useId();
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
    <div className={styles.container} ref={containerRef}>
      {/* mm:I2167:9091;186:2101;186:2020 */}
      <button
        type="button"
        data-testid="notification-bell"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("label")}
        onClick={() => setOpen((value) => !value)}
      >
        {/* mm:I2167:9091;186:2101;186:2020;186:1420 */}
        <IconNotification className={styles.icon} />
      </button>
      {open ? (
        <div id={panelId} data-testid="notification-panel" className={styles.panel}>
          <p className={styles.emptyText}>{t("empty")}</p>
        </div>
      ) : null}
    </div>
  );
}
