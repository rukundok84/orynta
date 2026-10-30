import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account — ORYNTA",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-bg p-6">
      <main className="mx-auto mt-16 max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">ORYNTA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an account to get started.
        </p>

        <div className="mt-6">
          <SignupForm />
        </div>
      </main>
    </div>
  );
}
