import { redirectIfUnauthenticated } from "@/lib/auth/session-guard";

/**
 * Stub landing page for authenticated users. Serves only as a working
 * redirect target for /login until a future plan builds the real /todo
 * feature — no data model or feature content here by design.
 */
export default async function TodoPage() {
  await redirectIfUnauthenticated("/login");

  return (
    <main>
      <p>Todo — coming soon</p>
    </main>
  );
}
