import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";

/**
 * Stub landing page for the account menu's "Admin Dashboard" link.
 * Role-gated: visitors whose role isn't `"admin"` (including unauthenticated
 * visitors, who default to `"user"`) are redirected to `/`. Establishes the
 * role-gating pattern; real content is a future plan — see
 * plans/260907-1545-home-screen/clarifications.md.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;
  const role = getUserRole(user);

  if (role !== "admin") {
    redirect("/");
    return null;
  }

  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>Coming soon</p>
    </main>
  );
}
