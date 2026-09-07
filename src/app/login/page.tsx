import { redirectIfAuthenticated } from "@/lib/auth/session-guard";
import { getOAuthErrorMessage } from "@/lib/auth/oauth-messages";
import { LoginScreenContainer } from "@/components/login/login-screen-container";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

/**
 * Server entry point for /login. Redirects an already-authenticated visitor
 * to /todo before anything renders, then maps the OAuth callback route's
 * `?error=` query param to the user-facing message shown by the client
 * container.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated("/todo");

  const { error } = await searchParams;
  const oauthErrorCode = getOAuthErrorMessage(error);

  return <LoginScreenContainer oauthErrorCode={oauthErrorCode} />;
}
