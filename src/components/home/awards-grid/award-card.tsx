import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./award-card.module.css";
import { IconChiTiet } from "./icons/icon-chi-tiet";
import type { AwardCategory } from "./award-categories";

export interface AwardCardProps {
  category: AwardCategory;
}

/**
 * mm:214:1032 (mms_C2.1_Top Talent Award instance, reused for C2.2-C2.6) —
 * image, title and "Chi tiết" link all navigate to the same
 * `/awards-information#{slug}` hash anchor, so the whole card is one link
 * per the integration contract.
 */
export function AwardCard({ category }: AwardCardProps) {
  const t = useTranslations("home.awards.categories");
  const tCommon = useTranslations("home.awards");
  const href = `/awards-information#${category.slug}`;
  const title = t(`${category.translationKey}.title`);

  return (
    <Link
      href={href}
      className={styles.card}
      data-testid="award-card"
      data-award-slug={category.slug}
      aria-label={title}
    >
      {/* mm:I2167:9075;214:1019_Picture-Award */}
      <span className={styles.imageWrap}>
        {/* mm:I2167:9075;214:1019;81:2442_MM_MEDIA_Award BG */}
        <Image
          src="/home/awards-grid/award-bg.png"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 336px"
          className={styles.bgImage}
        />
        {/* mm:I2167:9075;214:1019;214:666_Awards-Name (decorative wordmark) */}
        <Image
          src={category.nameImageSrc}
          alt=""
          width={category.nameImageWidth}
          height={category.nameImageHeight}
          className={styles.nameImage}
        />
      </span>

      {/* mm:I2167:9075;214:1020_Frame 490 */}
      <span className={styles.body}>
        {/* mm:I2167:9075;214:1021_mms_C2.1.2_Top Talent */}
        <span className={styles.title}>{title}</span>

        {category.hasDescription ? (
          // mm:I2167:9075;214:1022_mms_C2.1.3
          <span className={styles.description}>
            {t(`${category.translationKey}.description`)}
          </span>
        ) : null}

        {/* mm:I2167:9075;214:1023_mms_C2.1.4_Button-IC */}
        <span className={styles.detailLink}>
          <span>{tCommon("detailLabel")}</span>
          <IconChiTiet className={styles.detailIcon} />
        </span>
      </span>
    </Link>
  );
}
