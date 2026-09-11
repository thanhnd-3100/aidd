"use client";

import { useTranslations } from "next-intl";
import { montserrat } from "./fonts";
import { IconPen } from "./icons/icon-pen";
import { KudosCard } from "./kudos-card";
import styles from "./kudos-board.module.css";
import type { KudosBoardProps } from "./types";

/**
 * mm:2940:13431 (Sun* Kudos - Live board) — the presentational board slice
 * from phase-a1-board-screen.md: banner, "Ghi nhận" trigger, "ALL KUDOS"
 * feed (or its empty state), and "Load more". Prop-driven only — no
 * fetching/Supabase/routing/auth (owned by the integration phase), and no
 * carousel/filters/spotlight/sidebar/composer (deferred/out of scope per
 * clarifications.md).
 *
 * Messages live in src/messages/kudos.json under the `board` key, merged
 * into the `kudos` namespace by the integration phase (src/i18n/request.ts
 * is out of this task's file ownership) — follows the countdown.json
 * partial pattern.
 */
export function KudosBoard({
  kudos,
  hasMore,
  onLoadMore,
  onGhiNhanClick,
  onLikeClick,
  currentUserId,
}: KudosBoardProps) {
  const t = useTranslations("kudos.board");

  return (
    <div className={`${styles.board} ${montserrat.variable}`}>
      {/* mm:2940:13436 */}
      <header data-testid="kudos-banner" className={styles.banner}>
        {/* mm:2940:13439 */}
        <h1 className={styles.title}>{t("title")}</h1>
        {/* mm:2940:13440 */}
        <img
          src="/sun-kudos/board/kudos-wordmark.svg"
          alt={t("wordmarkAlt")}
          className={styles.wordmark}
        />
      </header>

      {/* mm:2940:13449 */}
      <button
        type="button"
        data-testid="ghi-nhan-button"
        className={styles.ghiNhanButton}
        onClick={onGhiNhanClick}
      >
        {/* mm:I2940:13449;186:2759 */}
        <IconPen className={styles.ghiNhanIcon} aria-hidden="true" />
        {/* mm:I2940:13449;186:2760 */}
        <span className={styles.ghiNhanText}>{t("ghiNhanPrompt")}</span>
      </button>

      <main data-testid="kudos-feed" className={styles.feed}>
        {/* mm:2940:14221 */}
        <div className={styles.feedHeader}>
          {/* mm:2940:14222 */}
          <p className={styles.feedEyebrow}>{t("feedEyebrow")}</p>
          {/* mm:2940:14223 */}
          <div className={styles.feedDivider} />
          {/* mm:2940:14225 */}
          <h2 className={styles.feedHeading}>{t("feedHeading")}</h2>
        </div>

        {/* mm:2940:13482 */}
        {kudos.length === 0 ? (
          <p data-testid="kudos-empty-state" className={styles.emptyState}>
            {t("emptyState")}
          </p>
        ) : (
          <ul className={styles.list}>
            {kudos.map((item) => (
              <li key={item.id}>
                <KudosCard kudos={item} currentUserId={currentUserId} onLikeClick={onLikeClick} />
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <button
            type="button"
            data-testid="kudos-load-more"
            className={styles.loadMoreButton}
            onClick={onLoadMore}
          >
            {t("loadMore")}
          </button>
        )}
      </main>
    </div>
  );
}
