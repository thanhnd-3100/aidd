"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import styles from "./language-selector.module.css";
import { IconChevronDown } from "./icons/icon-chevron-down";

const LOCALE_COOKIE = "NEXT_LOCALE";

const LOCALE_OPTIONS = [
  { code: "vi", flagSrc: "/login/flag-vn.svg", flagAlt: "Vietnam flag" },
  { code: "en", flagSrc: null, flagAlt: "" },
] as const;

function persistLocaleCookie(code: string) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * mm:I2167:9091;186:1696 — self-contained language selector for the home
 * header. Same cookie-toggle pattern as
 * src/components/login/language-selector.tsx (duplicated rather than
 * shared, per clarifications: the component is small and each Track A
 * section owns disjoint files).
 */
export function LanguageSelector() {
  const locale = useLocale();
  const t = useTranslations("home.header.language");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const current =
    LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];

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

  function selectLocale(code: string) {
    setOpen(false);
    if (code === locale) return;
    persistLocaleCookie(code);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    // mm:I2167:9091;186:1696
    <div className={styles.container} ref={containerRef}>
      {/* mm:I2167:9091;186:1696;186:1821 */}
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {/* mm:I2167:9091;186:1696;186:1821;186:1937 */}
        <span className={styles.current}>
          {current.flagSrc ? (
            <Image
              src={current.flagSrc}
              alt={current.flagAlt}
              width={24}
              height={24}
            />
          ) : null}
          <span>{t(current.code)}</span>
        </span>
        <IconChevronDown
          className={open ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}
        />
      </button>
      {open ? (
        <ul id={menuId} role="menu" className={styles.menu}>
          {LOCALE_OPTIONS.map((option) => (
            <li key={option.code} role="none">
              <button
                type="button"
                role="menuitem"
                className={styles.menuItem}
                aria-current={option.code === locale}
                onClick={() => selectLocale(option.code)}
              >
                {option.flagSrc ? (
                  <Image
                    src={option.flagSrc}
                    alt={option.flagAlt}
                    width={20}
                    height={20}
                  />
                ) : null}
                <span>{t(option.code)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
