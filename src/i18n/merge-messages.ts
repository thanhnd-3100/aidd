/** A next-intl messages tree: string leaves, arbitrarily nested. */
export type MessagesTree = { [key: string]: MessagesTree | string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively merges message trees, right-most source winning on leaf
 * conflicts. Two objects at the same key are merged deeply instead of one
 * overwriting the other, so partials contributed by independent files never
 * clobber each other's sibling keys.
 *
 * `path` tracks the dotted key path for the in-progress merge so a leaf
 * collision can be reported with its full location (e.g. "home.chrome.title")
 * rather than just the colliding key name.
 */
export function deepMergeMessages(
  ...sources: MessagesTree[]
): MessagesTree {
  return mergeAtPath([], ...sources);
}

function mergeAtPath(path: string[], ...sources: MessagesTree[]): MessagesTree {
  const result: MessagesTree = {};

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      const existing = result[key];
      const keyPath = [...path, key];

      if (isPlainObject(value) && isPlainObject(existing)) {
        result[key] = mergeAtPath(
          keyPath,
          existing as MessagesTree,
          value as MessagesTree
        );
      } else {
        // Leaf-level collision: both sources define this key with a
        // non-object value and they disagree. This is currently safe
        // because the home partials are disjoint, but a future partial
        // could silently clobber a sibling's key — warn (don't throw) so
        // the mistake surfaces without breaking the build.
        if (
          key in result &&
          !isPlainObject(existing) &&
          !isPlainObject(value) &&
          existing !== value
        ) {
          console.warn(
            `deepMergeMessages: leaf key collision at "${keyPath.join(".")}" — ` +
              `"${String(existing)}" was overwritten by "${String(value)}"`
          );
        }

        result[key] = value as MessagesTree | string;
      }
    }
  }

  return result;
}
