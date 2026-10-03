"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/app/auth/auth-shell";
import { signUpWithEmail } from "@/app/auth/actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpWithEmail, null);

  return (
    <AuthShell
      eyebrow="Keep my dream book"
      title="Make it yours."
      copy="If you already wrote dreams on this device, creating an account keeps that same journal and lets you carry it with you."
      footer={<span>Already have a Lucid journal? <Link href="/auth/sign-in">Sign in</Link></span>}
    >
      <form action={action} className="auth-form">
        <label>
          <span>What should Lucid call you?</span>
          <input type="text" name="name" autoComplete="name" required placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" />
        </label>
        {state?.error && <div className="auth-error">{state.error}</div>}
        <button type="submit" disabled={pending}>{pending ? "Binding your journal..." : "Keep my journal"}</button>
      </form>
    </AuthShell>
  );
}
