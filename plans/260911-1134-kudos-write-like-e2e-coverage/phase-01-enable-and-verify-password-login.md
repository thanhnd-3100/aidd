# Phase 01 — Enable + verify local password login (GO/NO-GO GATE)

## Context Links

- Research: `plans/reports/researcher-260911-1134-playwright-supabase-auth.md` §3
- `supabase/config.toml` line ~198 `[auth.email] enable_signup`
- `src/lib/auth/login-actions.ts` (production path — untouched)

## Overview

- **Priority:** P1, blocks everything
- **Status:** completed (GO)
- **Goal:** prove that a local Supabase user can sign in with email+password. Nothing else in
  this plan is worth building until this returns a session.

## Key Insights

- Measured this session: `signInWithPassword` fails with **"Email logins are disabled"**, caused by
  `[auth.email] enable_signup = false`.
- Measured this session: a self-signed JWT is useless — gotrue `GET /auth/v1/user` returns **500**,
  so `supabase.auth.getUser()` in the Server Component never accepts it. That door is closed.
- Measured this session: `admin.auth.admin.createUser({ id: <fixed uuid>, … })` is **accepted** and
  the `handle_new_user` trigger fires. So user creation is not the risk — login is.
- The flag needs a **supabase restart** to take effect, which walks straight into the docker hazard.

## Requirements

Functional:
- `signInWithPassword` against `http://127.0.0.1:54321` returns a session (non-null `access_token`).

Non-functional:
- `supabase/config.toml` ends this phase differing from HEAD by **exactly one line**:
  `[auth.email] enable_signup = true`. No `[storage]`, no `jwt_expiry`, nothing else.

## Architecture

```
config.toml flip  →  supabase stop && supabase start  →  gotrue restarts with
EXTERNAL_EMAIL_ENABLED=true  →  admin.createUser(probe)  →  signInWithPassword(probe)
   → session?  ── yes ─→  GO (phase 02)
              └─ no  ─→  fallback ladder below
```

## Related Code Files

- Modify: `supabase/config.toml` (one line)
- Create (throwaway, scratchpad — **not** the repo): probe script

## Implementation Steps

1. `git diff --stat supabase/config.toml` → must be empty before starting. If `[storage] enabled`
   is still `false` from the earlier workaround, restore it now.
2. Flip `[auth.email] enable_signup` to `true`. Leave every other key alone.
3. `supabase stop && supabase start`.
   - **Docker hazard:** if it dies on `failed to register layer: rename … file exists` while
     prepulling storage-api, mitigate by temporarily setting `[storage] enabled = false`, starting,
     then **restoring that line immediately and committing nothing but the auth flip**. Record in
     the phase notes that the run had storage disabled. Do not attempt to repair the docker layer.
4. Write a probe in the scratchpad (not the repo) that, with the service key:
   `admin.createUser({ email: 'probe@local.test', password: '…', email_confirm: true })`, then with
   the publishable key `signInWithPassword` the same credentials, then `admin.deleteUser(probe)`.
5. Run it. Print `error?.message` and `!!data.session`.

## Todo List

- [x] `config.toml` clean at HEAD
- [x] flip `enable_signup = true`
- [x] restart supabase — storage workaround WAS needed
- [x] probe create + sign-in
- [x] record GO or NO-GO with the exact gotrue message
- [x] `git diff supabase/config.toml` shows one changed line

## Success Criteria

- Probe prints a session and exits `0`.
- `git diff --numstat supabase/config.toml` → `1	1	supabase/config.toml`.

## Risk Assessment

| Risk | L | I | Countermove |
|---|---|---|---|
| Flag does not enable password login | Med | High | Fallback ladder (below) — this is why the phase is a gate |
| Docker layer blocks restart | High | High | Temporary `[storage] enabled = false`, restore before commit |
| config.toml left dirty | Med | Med | Diff assertion in success criteria |
| Restart wipes DB state | Low | Med | `supabase stop` without `--no-backup` keeps volumes; phase 02 re-seeds anyway |

### Fallback ladder if the probe says NO-GO

1. Also check the **top-level** `[auth] enable_signup` — a global disable overrides the email block.
2. Switch to admin-minted sessions: `admin.generateLink({ type: 'magiclink', email })`, then either
   `verifyOtp({ type: 'magiclink', token_hash })` through the same stub-jar client, or navigate the
   Playwright browser to the returned `action_link` so `/auth/callback` sets the cookies. Same
   downstream contract — only phase 03's setup body changes. Revert the config flip if this path wins.
3. Still nothing → **STOP and escalate.** Do not resurrect JWT minting: it is measured dead (500).

## Security Considerations

- `enable_signup = true` is local-only. Confirm the hosted project is untouched — no `supabase link`,
  no `db push`, in this whole plan.
- The service key belongs in `.env.local` (gitignored) only. Never in a committed file or a script literal.

## Next Steps

GO → phase 02. NO-GO after the full ladder → escalate to the user before any further phase starts.

## Result — 2026-09-11 (GO)

Gate PASSED. `[auth.email] enable_signup = true` does enable password login on this gotrue.

Probe output (service key via env, script run from repo root then deleted — never committed):
```
createUser -> ok id=03c9fc12-5ab2-48c9-bd12-70ca54670656
signInWithPassword -> ok
session? -> true access_token len=770
exit=0
```

Notes:
- Docker hazard HIT as predicted. `supabase start` cannot prepull `storage-api` (corrupt layer,
  `failed to register layer: rename … file exists`). Mitigated exactly as written: `[storage]
  enabled = false` for the start, restored immediately after. **This run had storage disabled** —
  services up are postgres, auth(gotrue), rest, kong. Also excluded: studio, imgproxy,
  edge-runtime, logflare, vector, realtime, mailpit, postgres-meta, supavisor.
- `supabase stop` kept the volume (`backup: true`), `start` reported "Starting database from
  backup" — migration + seed data survived the restart, no re-apply needed.
- `git diff --numstat supabase/config.toml` = `1	1` ✓ (only the auth flip).
- Fallback ladder NOT needed; unresolved question #1 in plan.md is now answered YES.
