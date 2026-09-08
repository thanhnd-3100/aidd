# Implementer Report: Fix reviewer findings on Home screen

## Task
Fix 3 reviewer findings: privilege escalation via client-writable role, Next.js Image aspect-ratio warning, i18n message merge collision guard.

## Changes

1. **Privilege escalation fix**
   - `src/lib/auth/get-user-role.ts`: reads `user.app_metadata?.role` instead of `user.user_metadata?.role`. Added comment explaining `app_metadata` is only writable via the privileged service-role/Admin API.
   - `src/lib/auth/get-user-role.test.ts`: mocks updated to `app_metadata`; added regression test asserting a `user_metadata.role` value is ignored.
   - `src/lib/home/get-homepage-view-data.test.ts`: mocks updated to `app_metadata`.
   - `src/app/admin-dashboard/page.test.tsx`: mocks updated to `app_metadata` (this test also mocked a Supabase user with a role and would have broken/been unsound otherwise).

2. **Image aspect-ratio fix**
   - `src/components/home/root-further/root-further-content.module.css`: `.rootText` `max-width: 65%` → `width: 65%`; `.furtherText` `max-width: 100%` → `width: 100%`. Both keep `height: auto`.

3. **Merge collision guard**
   - `src/i18n/merge-messages.ts`: added path-tracking internal `mergeAtPath` helper; on a leaf-level collision (both sources define the same key with a non-object, non-identical value) emits `console.warn` with the dotted key path (e.g. `home.chrome.title`). Deep-merge and right-most-wins behavior unchanged.
   - `src/i18n/merge-messages.test.ts`: added 3 tests — warns on leaf collision, does not warn on identical leaf values, does not warn on disjoint/nested-object merges.

## RED-first evidence
- `get-user-role.test.ts`: pre-fix run showed 2 failing (`Received: "user"` for admin case; `Received: "admin"` for the new user_metadata-ignore case) — confirmed RED before editing `get-user-role.ts`.
- `merge-messages.test.ts`: pre-fix run showed 1 failing (`toHaveBeenCalledTimes` expected 1, received 0) — confirmed RED before editing `merge-messages.ts`.

## Checks
- `npx tsc --noEmit`: clean.
- `npm run lint`: no errors/warnings in any touched file (repo has large pre-existing unrelated lint debt in `.claude/**`, untouched by this task).
- `npx jest src`: 14 suites, 60 tests passed.
- `npm run build`: compiled successfully, all routes generated.
- `npx playwright test e2e/home.spec.ts e2e/login.spec.ts`: 14 passed, 7 skipped (home 10 passed/4 skipped + login 4 passed/3 skipped) — matches expected baseline, no regressions.

## Files Touched
- `src/lib/auth/get-user-role.ts`
- `src/lib/auth/get-user-role.test.ts`
- `src/lib/home/get-homepage-view-data.test.ts`
- `src/app/admin-dashboard/page.test.tsx`
- `src/components/home/root-further/root-further-content.module.css`
- `src/i18n/merge-messages.ts`
- `src/i18n/merge-messages.test.ts`

No `e2e/**` files touched, no other `src/components/home/**` files touched.
