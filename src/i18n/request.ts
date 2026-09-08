import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { deepMergeMessages, type MessagesTree } from "./merge-messages";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

/** Each home section owns a partial file shaped `{ vi: {...}, en: {...} }`. */
type LocalizedPartial = Record<Locale, MessagesTree>;

const homePartialImports = [
  () => import("../messages/home/chrome.json"),
  () => import("../messages/home/hero.json"),
  () => import("../messages/home/content.json"),
  () => import("../messages/home/promo.json"),
];

function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

async function loadHomeMessages(locale: Locale): Promise<MessagesTree> {
  const partials = await Promise.all(
    homePartialImports.map(async (importPartial) => {
      const partial = (await importPartial()).default as LocalizedPartial;
      return partial[locale];
    })
  );

  return deepMergeMessages(...partials);
}

/**
 * Cookie-only locale resolution (no `[locale]` URL segment): reads
 * `NEXT_LOCALE`, falling back to `defaultLocale` when absent or invalid.
 *
 * Deep-merges the existing per-locale message file (currently the `login`
 * namespace) with the home screen's section partials
 * (`src/messages/home/{chrome,hero,content,promo}.json`), nesting all four
 * under a single `home` top-level key so Track A sections can each own a
 * disjoint file without conflicting writes.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const baseMessages = (await import(`../messages/${locale}.json`))
    .default as MessagesTree;
  const homeMessages = await loadHomeMessages(locale);

  return {
    locale,
    messages: deepMergeMessages(baseMessages, { home: homeMessages }),
  };
});
