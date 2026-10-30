"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { login } from "@/modules/auth/actions";
import type { AuthFormState } from "@/modules/auth/definitions";

const inputClassName =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{messages.join(", ")}</p>;
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<
    AuthFormState,
    FormData
  >(login, undefined);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-6">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={state?.errors?.email ? true : undefined}
          className={inputClassName}
        />
        <FieldError messages={state?.errors?.email} />
      </div>

      <div className="mt-4">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.errors?.password ? true : undefined}
          className={inputClassName}
        />
        <FieldError messages={state?.errors?.password} />
      </div>

      {state?.message ? (
        <p className="mt-4 text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-6 w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  );
}
