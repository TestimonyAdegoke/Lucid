"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/app/auth/auth-shell";
import { signInWithEmail } from "@/app/auth/actions";

export default function SignInPage() {
  const [state, action, pending] = useActionState(signInWithEmail, null);

  return (
    <AuthShell
      eyebrow="Open my dream book"
      title="Welcome back ♡"
      copy="Sign in to find the same journal on every device."
      footer={<span>New to Lucid? <Link href="/auth/sign-up">Make this journal yours</Link></span>}
    >
      <form action={action} className="auth-form">
        <label>
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" autoComplete="current-password" required placeholder="••••••••" />
        </label>
        {state?.error && <div className="auth-error">{state.error}</div>}
        <button type="submit" disabled={pending}>{pending ? "Opening your journal..." : "Open my journal"}</button>
      </form>
    </AuthShell>
  );
}
