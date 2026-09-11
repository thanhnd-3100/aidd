"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./kudos-composer.module.css";
import type { KudosComposerSubmitPayload, RecipientOption } from "./types";

const MAX_HASHTAGS = 5;
const MIN_HASHTAGS = 1;

export type KudosComposerProps = {
  open: boolean;
  onClose: () => void;
  recipientOptions: RecipientOption[];
  onSearchRecipient: (query: string) => void;
  onSubmit: (payload: KudosComposerSubmitPayload) => void;
  submitting: boolean;
  submitError?: string | null;
};

/**
 * Composer modal — Figma "Viết KUDO" (node 520:11647). Recipient
 * autocomplete, plain-text content, free-text hashtag chips, "Hủy"/"Gửi"
 * footer. Callback-driven only: no Supabase calls, no submit logic — the
 * parent supplies `recipientOptions` (via `onSearchRecipient`) and owns
 * `onSubmit`.
 *
 * Rich-text toolbar (mms_C), @mention autocomplete, image upload (mms_F) and
 * "send anonymously" (mms_G) are deferred per clarifications.md and are
 * intentionally not rendered.
 */
export function KudosComposer({
  open,
  onClose,
  recipientOptions,
  onSearchRecipient,
  onSubmit,
  submitting,
  submitError,
}: KudosComposerProps) {
  const t = useTranslations("kudos.composer");
  const titleId = useId();

  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] =
    useState<RecipientOption | null>(null);
  const [content, setContent] = useState("");
  const [hashtagDraft, setHashtagDraft] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  if (!open) return null;

  const canSubmit =
    !!selectedRecipient &&
    content.trim().length > 0 &&
    hashtags.length >= MIN_HASHTAGS &&
    !submitting;

  function resetState() {
    setRecipientQuery("");
    setRecipientOpen(false);
    setSelectedRecipient(null);
    setContent("");
    setHashtagDraft("");
    setHashtags([]);
  }

  function handleCancel() {
    resetState();
    onClose();
  }

  function handleRecipientQueryChange(value: string) {
    setRecipientQuery(value);
    setRecipientOpen(true);
    onSearchRecipient(value);
  }

  function selectRecipient(option: RecipientOption) {
    setSelectedRecipient(option);
    setRecipientQuery(option.name);
    setRecipientOpen(false);
  }

  function addHashtagFromDraft() {
    const value = hashtagDraft.trim();
    if (!value || hashtags.length >= MAX_HASHTAGS) return;
    if (hashtags.includes(value)) {
      setHashtagDraft("");
      return;
    }
    setHashtags((current) => [...current, value]);
    setHashtagDraft("");
  }

  function handleHashtagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addHashtagFromDraft();
    }
  }

  function removeHashtag(tag: string) {
    setHashtags((current) => current.filter((existing) => existing !== tag));
  }

  function handleSubmit() {
    if (!canSubmit || !selectedRecipient) return;
    onSubmit({
      recipientId: selectedRecipient.id,
      content: content.trim(),
      hashtags,
    });
  }

  return (
    // mm:520:11647
    <div
      className={styles.overlay}
      role="presentation"
      onClick={handleCancel}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        {/* mm:I520:11647;520:9870 */}
        <h2 id={titleId} className={styles.title}>
          {t("title")}
        </h2>

        {/* mm:I520:11647;520:9871 */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("recipient.label")} <span className={styles.required}>*</span>
          </label>
          <div className={styles.recipientCombobox}>
            <input
              type="text"
              className={styles.recipientInput}
              placeholder={t("recipient.placeholder")}
              value={recipientQuery}
              onChange={(event) =>
                handleRecipientQueryChange(event.target.value)
              }
              onFocus={() => setRecipientOpen(true)}
              aria-label={t("recipient.label")}
            />
            {recipientOpen && recipientOptions.length > 0 ? (
              <ul className={styles.recipientList} role="listbox">
                {recipientOptions.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={styles.recipientOption}
                      onClick={() => selectRecipient(option)}
                    >
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* mm:I520:11647;520:9886 */}
        <div className={styles.field}>
          <textarea
            className={styles.contentTextarea}
            placeholder={t("content.placeholder")}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            aria-label={t("content.label")}
          />
        </div>

        {/* mm:I520:11647;520:9890 */}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("hashtags.label")} <span className={styles.required}>*</span>
          </label>
          <div className={styles.hashtagGroup}>
            {hashtags.map((tag) => (
              <span key={tag} className={styles.hashtagChip}>
                #{tag}
                <button
                  type="button"
                  className={styles.hashtagRemove}
                  aria-label={t("hashtags.remove", { tag })}
                  onClick={() => removeHashtag(tag)}
                >
                  x
                </button>
              </span>
            ))}
            {hashtags.length < MAX_HASHTAGS ? (
              <input
                type="text"
                className={styles.hashtagInput}
                placeholder={t("hashtags.placeholder")}
                value={hashtagDraft}
                onChange={(event) => setHashtagDraft(event.target.value)}
                onKeyDown={handleHashtagKeyDown}
                onBlur={addHashtagFromDraft}
                aria-label={t("hashtags.label")}
              />
            ) : null}
          </div>
          <p className={styles.hashtagHint}>{t("hashtags.maxHint")}</p>
        </div>

        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}

        {/* mm:I520:11647;520:9905 */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className={styles.submitButton}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

export { MAX_HASHTAGS, MIN_HASHTAGS };
