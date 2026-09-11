// Makes the three local Supabase dev-seed identities loginable with a password.
//
// Why this exists: `supabase/seeds/dev/001_kudos_dev_seed.sql` inserts `auth.users` rows
// directly (encrypted_password = '', no `auth.identities` row), which gotrue can never
// authenticate. This script uses the admin API instead, which does create the identity row
// and lets the `handle_new_user` trigger populate `public.profiles`.
//
// Ordering contract: this script MUST run before the SQL seed. The SQL seed's
// `on conflict (id) do nothing` means it silently no-ops once these rows already exist -
// see `npm run db:reset:dev` in package.json for the enforced order.
//
// Usage: node scripts/seed-auth-users.ts

import { createClient } from '@supabase/supabase-js';
import { DEV_USERS, type DevSeedUser } from './dev-seed-user-list.ts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, ' +
      'SUPABASE_SERVICE_ROLE_KEY must all be set (see .env.local.example).',
  );
  process.exit(1);
}


const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertUser(user: DevSeedUser): Promise<void> {
  const { error: createError } = await admin.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name, avatar_url: user.avatar_url },
  });

  if (!createError) {
    console.log(`created: ${user.email}`);
    return;
  }

  const alreadyExists = /already been registered|already exists/i.test(createError.message);
  if (!alreadyExists) {
    console.error(`createUser failed for ${user.email}: ${createError.message}`);
    process.exit(1);
  }

  // Re-run path: user already has a real identity from a prior run of this script.
  // Just refresh the password so the fixture stays deterministic.
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: user.password,
    email_confirm: true,
  });

  if (updateError) {
    console.error(
      `updateUserById failed for ${user.email}: ${updateError.message}\n` +
        'This user likely has no auth.identities row (created by the raw-SQL seed, not this ' +
        'script) and cannot be repaired in place. Run `npm run db:reset:dev` to rebuild the ' +
        'fixture from a clean schema.',
    );
    process.exit(1);
  }

  console.log(`updated: ${user.email}`);
}

async function verifyLogin(user: DevSeedUser): Promise<void> {
  const { error } = await anon.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) {
    console.error(`signInWithPassword failed for ${user.email}: ${error.message}`);
    process.exit(1);
  }

  console.log(`verified login: ${user.email}`);
}

async function main(): Promise<void> {
  for (const user of DEV_USERS) {
    await upsertUser(user);
  }
  for (const user of DEV_USERS) {
    await verifyLogin(user);
  }
  console.log('All dev seed users are loginable.');
}

main().catch((error: unknown) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});
