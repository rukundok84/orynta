"use client";

import { LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/modules/auth/actions";

/**
 * Logs the user out (clears the session cookie, redirects to /login).
 * The label is configurable because the same action doubles as the way
 * out of a stale session — valid cookie, deleted account — where "Log in"
 * is the honest call to action.
 */
export function LogoutButton({ label = "Log out" }: { label?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {label !== "Log out" ? null : <LogOut />}
        {label}
      </button>
    </form>
  );
}
