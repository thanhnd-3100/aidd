import { formatKudosTimestamp } from "./format-kudos-timestamp";
import { formatLikeCount } from "./format-like-count";
import { IconHeart } from "./icons/icon-heart";
import { IconSend } from "./icons/icon-send";
import styles from "./kudos-card.module.css";
import type { KudosCardProps } from "./types";

/**
 * mm:3127:21871 (C.3_KUDO Post, component 256:5231) — one entry in the "ALL
 * KUDOS" feed. Static/presentational: sender/receiver identity, timestamp,
 * line-clamped content, plain hashtag text, and a like button disabled when
 * the viewer authored the kudos. Deferred per clarifications.md: star-tier
 * badges, attached images, and the "Copy Link" action (out of this slice).
 */
export function KudosCard({ kudos, currentUserId, onLikeClick }: KudosCardProps) {
  const isOwnKudos = currentUserId != null && kudos.senderId === currentUserId;

  return (
    // mm:3127:21871
    <article data-testid="kudos-card" className={styles.card}>
      {/* mm:I3127:21871;256:4857 */}
      <div className={styles.infoRow}>
        {/* mm:I3127:21871;256:4858 */}
        <div className={styles.person}>
          {/* mm:I3127:21871;256:4858;256:4734 */}
          <img src={kudos.senderAvatarUrl} alt="" className={styles.avatar} />
          {/* mm:I3127:21871;256:4858;256:4735 */}
          <p className={styles.personName}>{kudos.senderName}</p>
        </div>

        {/* mm:I3127:21871;256:5147 */}
        <IconSend className={styles.sendIcon} aria-hidden="true" />

        {/* mm:I3127:21871;256:4860 */}
        <div className={styles.person}>
          {/* mm:I3127:21871;256:4860;256:4734 */}
          <img src={kudos.receiverAvatarUrl} alt="" className={styles.avatar} />
          {/* mm:I3127:21871;256:4860;256:4735 */}
          <p className={styles.personName}>{kudos.receiverName}</p>
        </div>
      </div>

      {/* mm:I3127:21871;256:5192 */}
      <div className={styles.divider} />

      {/* mm:I3127:21871;256:5645 */}
      <div className={styles.content}>
        {/* mm:I3127:21871;256:5229 */}
        <p className={styles.timestamp}>{formatKudosTimestamp(kudos.createdAt)}</p>

        {/* mm:I3127:21871;662:11382 */}
        <div className={styles.contentBox}>
          {/* mm:I3127:21871;256:5156 */}
          <p className={styles.contentText}>{kudos.content}</p>
        </div>

        {kudos.hashtags.length > 0 && (
          // mm:I3127:21871;256:5158
          <ul className={styles.hashtagList}>
            {kudos.hashtags.map((tag) => (
              // mm:I3127:21871;256:5159
              <li key={tag} className={styles.hashtagChip}>
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* mm:I3127:21871;256:7496 */}
      <div className={styles.divider} />

      {/* mm:I3127:21871;256:5194 */}
      <div className={styles.actions}>
        {/* mm:I3127:21871;256:5175 */}
        <button
          type="button"
          data-testid="like-button"
          aria-label="like"
          aria-pressed={false}
          disabled={isOwnKudos}
          className={styles.likeButton}
          onClick={() => onLikeClick(kudos.id)}
        >
          {/* mm:I3127:21871;256:5174 */}
          <span className={styles.likeCount}>{formatLikeCount(kudos.likeCount)}</span>
          {/* mm:I3127:21871;256:5171 */}
          <IconHeart className={styles.heartIcon} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
