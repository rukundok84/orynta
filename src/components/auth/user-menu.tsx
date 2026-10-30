import { getUser } from "@/modules/auth/dal";
import { LogoutButton } from "./logout-button";

/**
 * Server component: shows who is signed in, plus a logout button.
 * Rendered behind a <Suspense> boundary in the NavBar because reading
 * the session happens at request time (cacheComponents).
 */
export async function UserMenu() {
  const user = await getUser();

  // Valid cookie but no user row — e.g. the account was deleted. The proxy
  // still lets the cookie through, so offer the only way out: the logout
  // action clears the cookie and lands on /login.
  if (!user) {
    return <LogoutButton label="Log in" />;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.name}
      </span>
      <LogoutButton />
    </div>
  );
}
