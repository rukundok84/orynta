import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in — ORYNTA",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg p-6">
      <main className="mx-auto mt-16 max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">ORYNTA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log in to turn your goals into data-backed opportunities across Rwanda.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
