# Clarifications — Sun* Kudos Board

## Session 2026-09-08

Resolved via a Scope Challenge (`AskUserQuestion`) at plan-creation time, ahead of the full
MoMorph Clarification Gate (which runs later, at `/tkm:takumi` time, per
`.claude/rules/momorph/momorph-development.md`).

- Q: Build the full Sun* Kudos board (highlight carousel, department/hashtag filters, spotlight
  word-cloud, sidebar leaderboards + Secret Box, anonymous send, rich text, image upload) or a
  reduced core slice first? -> A: Reduced slice — board feed + composer only. Everything else
  (carousel, filters, spotlight, sidebar, Secret Box, anonymous send, rich text/@mention,
  image upload, copy-link/detail nav, star badges) deferred to a follow-up plan. Rationale: none
  of the supporting data models (departments, star tiers, gift/box system) exist yet, and building
  them speculatively violates YAGNI.
- Q: How should pagination work for the feed? -> A: Simple "Load more" button (offset-based single
  fetch), not infinite scroll. Simpler to implement and test; infinite scroll adds no proven value
  at current expected volume.
- Q: How does the composer's hashtag input work without an existing hashtag catalog/admin system?
  -> A: Free-text tag chips typed by the user (Enter/comma to add, 'x' to remove), min 1 / max 5,
  stored as a `text[]` column directly on `kudos`. No separate hashtags table, no admin-managed
  catalog, no click-to-filter (filtering is out of scope).
- Q: How does the composer find a recipient without a `profiles`/roles table today? -> A: Add a
  minimal `profiles` table (`id`, `full_name`, `avatar_url`) populated by a Postgres trigger on
  `auth.users` insert — the standard Supabase pattern — so the client can search Sunners without
  service-role calls per keystroke. First DB schema in this project (`supabase/migrations` was
  empty).
- Q: What happens when an unauthenticated visitor clicks "Ghi nhận" or a heart? -> A: Redirect to
  `/login`. No existing "gate an action, not a page" precedent found in `session-guard.ts` or
  elsewhere in the app, so the simplest option was chosen rather than inventing a new pattern.
- Q: How is "can't like your own kudos" enforced? -> A: App-layer validation inside the like server
  action (checks `sender_id !== auth.uid()` before inserting), not a DB CHECK constraint — keeps
  the constraint logic in one reviewable TypeScript place matching this project's existing
  RED-first testing convention (a CHECK constraint failure is harder to unit-test and message than
  a guarded server action).
- Q: On kudos submit, does the feed update via optimistic prepend or refetch? -> A: Refetch the
  first page after a successful insert (simplest correct approach — KISS; optimistic UI adds
  complexity for a first cut and can follow later if the refetch feels slow in practice).
- Q: Test policy? -> A: `e2e-red-first` (auto-selected — both screens have real state transitions:
  composer modal open/close, form validation, like/unlike toggle — per
  `momorph-development.md`'s Test-policy Resolution rule 3). Not user-chosen; recorded here for
  audit trail.
