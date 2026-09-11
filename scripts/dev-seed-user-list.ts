// The three local dev identities, shared by the seeding script and the Playwright
// auth setup.
//
// This module is deliberately side-effect-free. `seed-auth-users.ts` calls
// `main()` at import time, so anything importing this list from there would
// re-seed as a side effect — and a transient failure would `process.exit(1)`
// during module load, killing the whole Playwright run with a stack pointing at
// the seed script instead of the test that actually failed.
//
// Metadata must match `supabase/seeds/dev/001_kudos_dev_seed.sql` exactly - both
// write the same three identities, keyed by the same fixed UUIDs so FKs never
// need re-keying.

const DEV_PASSWORD = process.env.SUPABASE_DEV_USER_PASSWORD ?? 'kudos-dev-password-123';

export interface DevSeedUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  avatar_url: string;
}

export const DEV_USERS: DevSeedUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'an.nguyen@sun-asterisk.dev',
    password: DEV_PASSWORD,
    full_name: 'An Nguyen',
    avatar_url: 'https://i.pravatar.cc/150?u=an-nguyen',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'binh.tran@sun-asterisk.dev',
    password: DEV_PASSWORD,
    full_name: 'Binh Tran',
    avatar_url: 'https://i.pravatar.cc/150?u=binh-tran',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'chi.le@sun-asterisk.dev',
    password: DEV_PASSWORD,
    full_name: 'Chi Le',
    avatar_url: 'https://i.pravatar.cc/150?u=chi-le',
  },
];
