"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import styles from "./nav-link.module.css";

interface NavLinkProps {
  href: string;
  active: boolean;
  children: ReactNode;
}

/**
 * mm:I2167:9091;186:1579 (selected) / mm:I2167:9091;186:1587 (hover/normal)
 * — shared header + footer nav link. Per spec item A1.2: clicking the
 * already-selected link scrolls to top instead of a no-op navigation.
 */
export function NavLink({ href, active, children }: NavLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (active) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <Link
      href={href}
      className={active ? `${styles.link} ${styles.active}` : styles.link}
      aria-current={active ? "page" : undefined}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
