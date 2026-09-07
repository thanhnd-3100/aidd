/**
 * Recognized OAuth callback error codes. The display message for each code
 * lives in the locale-aware `login.hero.errorMessage` message key, resolved
 * at render time via `useTranslations` — this module never hardcodes a
 * display string.
 */
export type OAuthErrorCode = "oauth_failed";

const RECOGNIZED_OAUTH_ERROR_CODES: ReadonlySet<string> = new Set<OAuthErrorCode>([
  "oauth_failed",
]);

/**
 * Validates a query-string error code from the OAuth callback route.
 *
 * Unrecognized or absent codes resolve to `null` so callers can decide
 * whether to render an error area at all.
 */
export function getOAuthErrorMessage(
  errorCode: string | null | undefined
): OAuthErrorCode | null {
  if (!errorCode) {
    return null;
  }

  return RECOGNIZED_OAUTH_ERROR_CODES.has(errorCode)
    ? (errorCode as OAuthErrorCode)
    : null;
}
