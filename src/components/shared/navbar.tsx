import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/analytics", label: "Insights" },
];

/**
 * Server component. The account area reads the session at request time
 * (cacheComponents), so <UserMenu /> streams in behind a Suspense boundary —
 * the rest of the bar stays in the static shell.
 */
export function NavBar() {
  return (
    <header className="border-b border-bg muted-foreground/40 bg-bg sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          ORYNTA
        </Link>

        <div className="flex items-center gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {link.label}
            </Link>
          ))}

          <Suspense
            fallback={
              <div
                className="h-7 w-28 animate-pulse rounded-md bg-muted"
                aria-hidden="true"
              />
            }>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
