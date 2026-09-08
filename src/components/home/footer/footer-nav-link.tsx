"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./footer-nav-link.module.css";

interface FooterNavLinkProps {
  href: string;
  children: ReactNode;
}

/** mm:I5001:14800;342:1410 (7.2-7.4) — footer nav link. */
export function FooterNavLink({ href, children }: FooterNavLinkProps) {
  return (
    <Link href={href} className={styles.link}>
      {children}
    </Link>
  );
}
