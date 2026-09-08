"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./account-menu.module.css";
import { IconUser } from "./icons/icon-user";

export interface AccountMenuProps {
  role: "user" | "admin";
}

/**
 * mm:I2167:9091;186:1597 (A1.8) — account icon + menu. Presentational only:
 * Profile has no dedicated page yet and Sign out has no wired auth call
 * (Track B/integration owns both); Admin Dashboard links to the real stub
 * route from Phase B0, gated on `role`.
 */
export function AccountMenu({ role }: AccountMenuProps) {
  const t = useTranslations("home.header.account");
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
    <div className={styles.container} ref={containerRef}>
      {/* mm:I2167:9091;186:1597 */}
      <button
        type="button"
        data-testid="account-icon"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("label")}
        onClick={() => setOpen((value) => !value)}
      >
        {/* mm:I2167:9091;186:1597;186:1420 */}
        <IconUser className={styles.icon} />
      </button>
      {open ? (
        <ul id={menuId} role="menu" className={styles.menu}>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              {t("profile")}
            </button>
          </li>
          {role === "admin" ? (
            <li role="none">
              <Link
                href="/admin-dashboard"
                role="menuitem"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                {t("adminDashboard")}
              </Link>
            </li>
          ) : null}
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              {t("signOut")}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
